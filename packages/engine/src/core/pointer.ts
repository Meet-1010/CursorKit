import { TAU, clamp, damp, dampAngle } from '@ck/math';
import type { HoverKind, Pointer } from './types';

const TRAIL_MAX = 64;

/**
 * Owns pointer state and the input listeners that feed it.
 *
 * Deliberately does no drawing and holds no canvas reference — the same tracker
 * drives the page cursor and every gallery preview.
 */
export class PointerTracker {
  readonly p: Pointer;

  /** Where the pointer would be if nothing were pulling on it. */
  private tx = 0;
  private ty = 0;
  /** Raw velocity accumulator, smoothed into `p.vx/vy`. */
  private rvx = 0;
  private rvy = 0;
  private lastMove = 0;
  private bound = false;
  private root: Document | HTMLElement;

  constructor(root: Document | HTMLElement = document) {
    this.root = root;
    const cx = typeof innerWidth === 'number' ? innerWidth / 2 : 0;
    const cy = typeof innerHeight === 'number' ? innerHeight / 2 : 0;
    this.tx = cx;
    this.ty = cy;
    this.p = {
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      speed: 0,
      angle: 0,
      down: false,
      press: 0,
      sinceDown: 99,
      hover: 'none',
      hoverAmt: 0,
      hoverRect: null,
      hoverEl: null,
      label: null,
      inside: false,
      vis: 0,
      idle: 99,
      t: 0,
      trail: new Float32Array(TRAIL_MAX * 2),
      trailLen: 0,
    };
    for (let i = 0; i < TRAIL_MAX; i++) {
      this.p.trail[i * 2] = cx;
      this.p.trail[i * 2 + 1] = cy;
    }
  }

  /** Feed a position directly. Used by previews that map their own coordinates. */
  moveTo(x: number, y: number): void {
    this.tx = x;
    this.ty = y;
    this.p.inside = true;
    this.lastMove = this.p.t;
  }

  setDown(down: boolean): void {
    if (down && !this.p.down) this.p.sinceDown = 0;
    this.p.down = down;
  }

  setInside(inside: boolean): void {
    this.p.inside = inside;
  }

  setHover(kind: HoverKind, el: Element | null, rect: DOMRect | null, label: string | null): void {
    this.p.hover = kind;
    this.p.hoverEl = el;
    this.p.hoverRect = rect;
    this.p.label = label;
  }

  /**
   * Advance one frame.
   *
   * `magnetism` pulls the resting position toward the centre of the hovered
   * element — applied here rather than in the hover transform so that trails and
   * springs downstream inherit the pull naturally.
   */
  step(dt: number, magnetism = 0): void {
    const p = this.p;
    p.t += dt;

    let tx = this.tx;
    let ty = this.ty;

    if (magnetism > 0 && p.hoverRect && p.hoverAmt > 0.001) {
      const r = p.hoverRect;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // Falls off toward the element edge so the cursor never feels stuck.
      const pull = magnetism * p.hoverAmt;
      tx += (cx - tx) * pull;
      ty += (cy - ty) * pull;
    }

    const px = p.x;
    const py = p.y;
    // Raw position tracks 1:1 — smoothing is each style's business, so that a
    // hard crosshair stays exact while a spring trail lags behind it.
    p.x = tx;
    p.y = ty;

    if (dt > 0) {
      const ivx = (p.x - px) / dt;
      const ivy = (p.y - py) / dt;
      this.rvx = damp(this.rvx, ivx, 18, dt);
      this.rvy = damp(this.rvy, ivy, 18, dt);
    }
    p.vx = this.rvx;
    p.vy = this.rvy;
    p.speed = Math.hypot(p.vx, p.vy);

    // Only re-aim while actually moving; otherwise directional styles jitter as
    // velocity decays through zero.
    if (p.speed > 24) {
      p.angle = dampAngle(p.angle, Math.atan2(p.vy, p.vx), 14, dt);
    }

    p.idle = p.t - this.lastMove;
    if (Math.hypot(p.x - px, p.y - py) > 0.4) {
      this.lastMove = p.t;
      p.idle = 0;
    }

    p.sinceDown += dt;
    p.press = damp(p.press, p.down ? 1 : 0, p.down ? 30 : 12, dt);
    p.vis = damp(p.vis, p.inside ? 1 : 0, 14, dt);
    p.hoverAmt = damp(p.hoverAmt, p.hover !== 'none' && p.hover !== 'native' ? 1 : 0, 13, dt);

    this.pushTrail(p.x, p.y);
  }

  private pushTrail(x: number, y: number): void {
    const t = this.p.trail;
    // Shift newest-first. 64 entries is small enough that copyWithin beats a
    // head index for cache behaviour, and it keeps styles trivially simple.
    t.copyWithin(2, 0, (TRAIL_MAX - 1) * 2);
    t[0] = x;
    t[1] = y;
    if (this.p.trailLen < TRAIL_MAX) this.p.trailLen++;
  }

  /**
   * Sample the trail at a fractional index with linear interpolation, so trails
   * stay smooth when the pointer outruns the frame rate.
   */
  sample(i: number, out: { x: number; y: number }): void {
    const t = this.p.trail;
    const max = this.p.trailLen - 1;
    const f = clamp(i, 0, max < 0 ? 0 : max);
    const a = Math.floor(f);
    const b = Math.min(a + 1, max < 0 ? 0 : max);
    const m = f - a;
    out.x = t[a * 2] + (t[b * 2] - t[a * 2]) * m;
    out.y = t[a * 2 + 1] + (t[b * 2 + 1] - t[a * 2 + 1]) * m;
  }

  attach(): void {
    if (this.bound) return;
    this.bound = true;
    const r = this.root as Document;
    r.addEventListener('pointermove', this.onMove as EventListener, { passive: true });
    r.addEventListener('pointerdown', this.onDown as EventListener, { passive: true });
    // Release on the window: a drag that ends outside the document still ends.
    window.addEventListener('pointerup', this.onUp as EventListener, { passive: true });
    window.addEventListener('pointercancel', this.onUp as EventListener, { passive: true });
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('pointerleave', this.onLeave as EventListener, { passive: true });
    document.addEventListener('pointerenter', this.onEnter as EventListener, { passive: true });
  }

  detach(): void {
    if (!this.bound) return;
    this.bound = false;
    const r = this.root as Document;
    r.removeEventListener('pointermove', this.onMove as EventListener);
    r.removeEventListener('pointerdown', this.onDown as EventListener);
    window.removeEventListener('pointerup', this.onUp as EventListener);
    window.removeEventListener('pointercancel', this.onUp as EventListener);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('pointerleave', this.onLeave as EventListener);
    document.removeEventListener('pointerenter', this.onEnter as EventListener);
  }

  private onMove = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    this.moveTo(e.clientX, e.clientY);
  };

  private onDown = (e: PointerEvent): void => {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    this.moveTo(e.clientX, e.clientY);
    this.setDown(true);
  };

  private onUp = (): void => this.setDown(false);

  /** Tab-away must not leave the cursor stuck in a pressed state. */
  private onBlur = (): void => {
    this.setDown(false);
    this.p.inside = false;
  };

  private onLeave = (): void => this.setInside(false);
  private onEnter = (): void => this.setInside(true);
}

/** Reads a trail sample into a scratch object without allocating. */
export const scratch = { x: 0, y: 0 };

/** Direction the pointer is heading, snapped to a unit vector. */
export function heading(p: Pointer): { x: number; y: number } {
  const a = p.angle;
  return { x: Math.cos(a), y: Math.sin(a) };
}

export { TRAIL_MAX, TAU };
