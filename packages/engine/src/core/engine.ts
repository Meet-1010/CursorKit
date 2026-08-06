import { adaptContrast, clamp, damp, luminance, mulberry32, parseHex, type RGB } from '@ck/math';
import { BackdropSampler } from './backdrop';
import { HoverWatcher, type HoverHit } from './hover';
import { DEFAULTS, hasFinePointer, prefersReducedMotion } from './options';
import { PointerTracker } from './pointer';
import { getEffect, getHover, getStyle, onRegister } from './registry';
import { Surface, hideNativeCursor, restoreNativeCursor } from './surface';
import type { ClickEffect, Ctx, CursorStyle, EffectInstance, Options } from './types';

/** Hard ceiling on concurrent click effects. Rapid clicking must not compound. */
const MAX_EFFECTS = 24;
/** Frames longer than this are treated as a tab-return, not a slow frame. */
const MAX_DT = 1 / 20;

export interface EngineHost {
  /** Draw into an existing canvas instead of a fixed overlay. */
  canvas?: HTMLCanvasElement;
  /** Skip hiding the page's native cursor. Previews want this. */
  keepNativeCursor?: boolean;
  /** Feed input manually rather than binding document listeners. */
  manualInput?: boolean;
  seed?: number;
}

export class Engine {
  readonly pointer: PointerTracker;
  readonly surface: Surface;
  o: Options;

  private style: CursorStyle | null = null;
  private styleState: any = null;
  private effect: ClickEffect | null = null;
  private live: EffectInstance[] = [];
  private raf = 0;
  private last = 0;
  private running = false;
  private calm = false;
  private host: EngineHost;
  private rnd: () => number;
  private hoverWatcher: HoverWatcher | null = null;
  private unsubscribe: (() => void) | null = null;
  private col: RGB;
  private col2: RGB;
  private hoverColorCache: { key: string; rgb: RGB } | null = null;

  private backdrop = new BackdropSampler();
  private onLight = 0;
  /** Adapted colours, recomputed only when the backdrop actually changes. */
  private adapted: { key: string; col: RGB; col2: RGB } | null = null;

  private ctx: Ctx;

  constructor(options: Partial<Options> = {}, host: EngineHost = {}) {
    this.o = { ...DEFAULTS, ...options };
    this.host = host;
    this.rnd = mulberry32(host.seed ?? 0x9e3779b9);
    this.calm = this.o.respectReducedMotion && prefersReducedMotion();

    this.col = parseHex(this.o.color);
    this.col2 = this.o.color2 ? parseHex(this.o.color2) : this.col;

    this.surface = new Surface(
      { zIndex: this.o.zIndex, blend: this.o.blend },
      host.canvas,
    );
    this.pointer = new PointerTracker();

    this.ctx = {
      c: this.surface.c,
      p: this.pointer.p,
      o: this.o,
      dt: 0,
      t: 0,
      w: 0,
      h: 0,
      dpr: 1,
      col: this.col,
      col2: this.col2,
      scale: this.o.size,
      alpha: this.o.opacity,
      rawCol: this.col,
      backdrop: this.backdrop.colour,
      onLight: 0,
      backdropKnown: true,
      rnd: this.rnd,
      calm: this.calm,
    };

    this.resolve();
    this.unsubscribe = onRegister(() => this.resolve());
  }

  /* ------------------------------------------------------------ lifecycle -- */

  start(parent?: Element): this {
    if (this.running) return this;
    this.running = true;
    this.surface.mount(parent);

    if (!this.host.manualInput) {
      this.pointer.attach();
      this.hoverWatcher = new HoverWatcher(this.o.ignore, this.onHover);
      this.hoverWatcher.attach();
    }
    if (!this.host.keepNativeCursor) hideNativeCursor(this.o.ignore);

    document.addEventListener('visibilitychange', this.onVisibility);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    return this;
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.pointer.detach();
    this.hoverWatcher?.detach();
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.style?.dispose?.(this.styleState);
    this.surface.destroy();
    if (!this.host.keepNativeCursor) restoreNativeCursor();
    this.live.length = 0;
  }

  /** Apply new options in place. Used by the builder's live preview. */
  update(patch: Partial<Options>): void {
    const blendChanged = patch.blend !== undefined && patch.blend !== this.o.blend;
    const styleChanged = patch.style !== undefined && patch.style !== this.o.style;
    Object.assign(this.o, patch);
    if (patch.color !== undefined) {
      this.col = parseHex(this.o.color);
      this.ctx.col = this.col;
    }
    if (patch.color !== undefined || patch.color2 !== undefined) {
      this.col2 = this.o.color2 ? parseHex(this.o.color2) : this.col;
      this.ctx.col2 = this.col2;
    }
    if (blendChanged) this.surface.setBlend(this.o.blend);
    this.resolve();
    // A new style must not inherit the previous one's state bag.
    if (styleChanged) this.styleState = this.style?.state?.() ?? null;
  }

  /** Re-read the registry. Cheap, and safe to call on every chunk arrival. */
  private resolve(): void {
    const next = getStyle(this.o.style) || getStyle(DEFAULTS.style) || null;
    if (next !== this.style) {
      // A style that built its own DOM has to be told to take it down, or
      // switching styles in the builder leaves the old one's layers behind.
      this.style?.dispose?.(this.styleState);
      this.style = next;
      this.styleState = next?.state?.() ?? null;
    }
    this.effect = getEffect(this.o.click) || null;

    // A style's suggested blend applies only when the author left blend alone.
    if (this.o.blend === 'normal' && this.style?.blend) {
      this.surface.setBlend(this.style.blend);
    }
  }

  /* ---------------------------------------------------------------- input -- */

  /** Manual input entry points, for previews that own their own event handling. */
  moveTo(x: number, y: number): void {
    this.pointer.moveTo(x, y);
  }

  press(down: boolean, x?: number, y?: number): void {
    if (down && x !== undefined && y !== undefined) this.pointer.moveTo(x, y);
    this.pointer.setDown(down);
    if (down) this.fire(x ?? this.pointer.p.x, y ?? this.pointer.p.y);
  }

  setInside(inside: boolean): void {
    this.pointer.setInside(inside);
  }

  setHover(hit: HoverHit): void {
    this.onHover(hit, hit.el ? hit.el.getBoundingClientRect() : null);
  }

  /** Spawn one instance of the configured click effect. */
  fire(x: number, y: number): void {
    if (!this.effect) return;
    if (this.calm) return;
    if (this.live.length >= MAX_EFFECTS) this.live.shift();
    const e = this.effect.spawn(this.ctx, x, y);
    e.age = 0;
    e.k = 0;
    // Pin the definition to the instance so effects already in flight finish
    // drawing correctly when the builder switches effect mid-animation.
    e.__def = this.effect;
    this.live.push(e);
  }

  private onHover = (hit: HoverHit, rect: DOMRect | null): void => {
    this.pointer.setHover(hit.kind, hit.el, rect, hit.label);
    // Cache the parsed per-element colour: pointerover fires constantly on
    // nested markup and parsing hex on every hover shows up in profiles.
    if (hit.color) {
      if (this.hoverColorCache?.key !== hit.color) {
        this.hoverColorCache = { key: hit.color, rgb: parseHex(hit.color, this.col) };
      }
    } else {
      this.hoverColorCache = null;
    }
  };

  private onVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
    } else if (this.running) {
      // Reset the clock, or the first frame back gets a multi-second dt.
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  };

  /* ---------------------------------------------------------------- frame -- */

  private frame = (now: number): void => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);

    const rawDt = clamp((now - this.last) / 1000, 0, MAX_DT);
    this.last = now;
    const dt = rawDt * this.o.speed;

    try {
      this.render(dt, rawDt);
    } catch (err) {
      // One broken style must not leave the visitor without a pointer.
      console.error('[CursorKit] render failed, restoring native cursor', err);
      this.destroy();
    }
  };

  private render(dt: number, rawDt: number): void {
    const { surface: sf, ctx, o } = this;
    const hoverT = getHover(o.hover);

    this.hoverWatcher?.tick(this.pointer.p.t);
    this.pointer.step(rawDt, this.calm ? 0 : hoverT?.magnetism ?? 0);

    sf.sync();
    sf.begin();

    ctx.dt = dt;
    ctx.t = this.pointer.p.t * o.speed;
    ctx.w = sf.w;
    ctx.h = sf.h;
    ctx.dpr = sf.dpr;
    ctx.scale = o.size;
    ctx.calm = this.calm;

    // Read the page beneath the cursor. Throttled inside the sampler, because
    // this forces style resolution and the answer changes far more slowly than
    // the pointer moves.
    const p0 = this.pointer.p;
    this.backdrop.tick(p0.x, p0.y, p0.t);
    ctx.backdrop = this.backdrop.colour;
    ctx.backdropKnown = this.backdrop.confident;

    // Eased, so crossing a boundary is a transition rather than a snap.
    this.onLight = damp(this.onLight, luminance(this.backdrop.colour) > 0.5 ? 1 : 0, 8, dt);
    ctx.onLight = this.onLight;

    const base = this.hoverColorCache ? this.hoverColorCache.rgb : this.col;
    ctx.rawCol = base;
    ctx.col = base;
    ctx.col2 = this.col2;

    if (o.adapt && this.backdrop.confident) {
      // Cache on the pair, so the contrast solve runs on backdrop changes
      // rather than every frame.
      const key = `${base.r},${base.g},${base.b}|${ctx.backdrop.r},${ctx.backdrop.g},${ctx.backdrop.b}`;
      if (this.adapted?.key !== key) {
        this.adapted = {
          key,
          // 3:1 rather than 4.5:1 — a cursor is a graphical object, not body
          // text, and 4.5 pushes brand colours much further than it needs to.
          col: adaptContrast(base, ctx.backdrop, 3),
          col2: adaptContrast(this.col2, ctx.backdrop, 2.2),
        };
      }
      ctx.col = this.adapted.col;
      ctx.col2 = this.adapted.col2;
    }

    const p = this.pointer.p;
    // Fade out entirely when the pointer leaves, or when it sits over an
    // element that asked for the native cursor back.
    const nativeFade = p.hover === 'native' ? 0 : 1;
    ctx.alpha = o.opacity * p.vis * nativeFade;

    // A DOM-backed style keeps painting on its own, so it has to be told the
    // cursor is meant to be invisible rather than simply not asked to draw.
    if (ctx.alpha <= 0.002) {
      this.style?.hidden?.(this.styleState);
      return;
    }

    const c = sf.c;

    // Effects that draw beneath the cursor.
    this.drawEffects(true);

    c.save();
    c.globalAlpha = ctx.alpha;
    hoverT?.pre?.(ctx);
    this.style?.draw(ctx, this.styleState);
    c.restore();

    if (hoverT?.post) {
      c.save();
      c.globalAlpha = ctx.alpha;
      hoverT.post(ctx);
      c.restore();
    }

    // Effects that draw on top.
    this.drawEffects(false);

  }

  private drawEffects(under: boolean): void {
    if (!this.live.length) return;
    const { ctx } = this;
    const c = ctx.c;
    const dt = ctx.dt;

    for (let i = this.live.length - 1; i >= 0; i--) {
      const e = this.live[i];
      const def = (e.__def as ClickEffect) || this.effect;
      if (!def) {
        this.live.splice(i, 1);
        continue;
      }
      // Age once per frame, on the pass that owns this instance.
      const isUnder = def.under !== false;
      if (isUnder !== under) continue;

      e.age += dt;
      if (e.age >= e.life) {
        this.live.splice(i, 1);
        continue;
      }
      e.k = e.age / e.life;

      c.save();
      c.globalAlpha = ctx.alpha;
      def.draw(ctx, e);
      c.restore();
    }
  }
}

/** Boots the page-level cursor, or returns null when the device has no pointer. */
export function boot(options: Partial<Options>, host: EngineHost = {}): Engine | null {
  const o = { ...DEFAULTS, ...options };
  if (!o.touch && !hasFinePointer()) return null;
  const engine = new Engine(o, host);
  const go = () => engine.start();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go, { once: true });
  } else {
    go();
  }
  // Fire click effects from real clicks; previews call `fire` themselves.
  if (!host.manualInput) {
    document.addEventListener(
      'pointerdown',
      (e: PointerEvent) => {
        if (e.pointerType === 'touch' || e.button !== 0) return;
        engine.fire(e.clientX, e.clientY);
      },
      { passive: true },
    );
  }
  return engine;
}
