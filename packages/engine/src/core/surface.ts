/**
 * The canvas the cursor is drawn on, plus the stylesheet that hides the native
 * one. Kept separate from the engine so previews can supply their own canvas.
 */

export interface SurfaceOpts {
  zIndex: number;
  blend: string;
  /** Cap device pixel ratio. 2 is indistinguishable from 3 for line art and
   *  roughly halves fill cost on phones-as-desktops and 5K displays. */
  maxDpr?: number;
}

export class Surface {
  readonly canvas: HTMLCanvasElement;
  readonly c: CanvasRenderingContext2D;
  w = 0;
  h = 0;
  dpr = 1;

  private maxDpr: number;
  private ro: ResizeObserver | null = null;
  private owned: boolean;
  /** Set by resize/observer, cleared by `sync`. Starts true for first measure. */
  private dirty = true;

  constructor(opts: SurfaceOpts, existing?: HTMLCanvasElement) {
    this.maxDpr = opts.maxDpr ?? 2;
    this.owned = !existing;
    this.canvas = existing || document.createElement('canvas');

    if (this.owned) {
      const s = this.canvas.style;
      s.position = 'fixed';
      s.top = '0';
      s.left = '0';
      s.width = '100%';
      s.height = '100%';
      s.pointerEvents = 'none';
      s.zIndex = String(opts.zIndex);
      // Never let the overlay create a scrollbar or trap a11y focus.
      s.contain = 'strict';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.setAttribute('data-cursorkit', 'surface');
    }
    if (opts.blend && opts.blend !== 'normal') {
      this.canvas.style.mixBlendMode = opts.blend;
    }

    const ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) throw new Error('CursorKit: 2d context unavailable');
    this.c = ctx;
  }

  mount(parent: Element = document.body): void {
    if (this.owned && !this.canvas.isConnected) parent.appendChild(this.canvas);
    this.sync();
    if (this.owned) {
      window.addEventListener('resize', this.invalidate, { passive: true });
    } else if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(this.invalidate);
      this.ro.observe(this.canvas);
    }
    // Moving a window between displays changes dpr without firing resize.
    matchMedia?.(`(resolution: ${window.devicePixelRatio}dppx)`)?.addEventListener?.(
      'change',
      this.invalidate,
      { once: true },
    );
  }

  destroy(): void {
    window.removeEventListener('resize', this.invalidate);
    this.ro?.disconnect();
    this.ro = null;
    if (this.owned) this.canvas.remove();
  }

  setBlend(mode: string): void {
    this.canvas.style.mixBlendMode = mode === 'normal' ? '' : mode;
  }

  /**
   * Marks the backing store as needing to be re-measured.
   *
   * Measuring is deliberately *not* done here. `clientWidth` forces layout, and
   * the engine calls into the surface every frame — on the gallery page, with a
   * dozen preview canvases live at once, measuring eagerly would mean a dozen
   * forced layouts per frame. Instead the resize and ResizeObserver handlers
   * only raise this flag, and `sync` does the work once, on the next frame.
   */
  invalidate = (): void => {
    this.dirty = true;
  };

  /** Re-measures only when something has actually changed. */
  sync(): void {
    if (!this.dirty) return;
    this.dirty = false;
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    // Clamped because a mis-styled host can report a runaway size, and a canvas
    // will happily try to allocate the buffer for it and take the tab down.
    // 8192 is past any real display and cheap to enforce.
    const w = clampSize(this.owned ? window.innerWidth : this.canvas.clientWidth);
    const h = clampSize(this.owned ? window.innerHeight : this.canvas.clientHeight);
    if (w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    // Assigning width/height also clears the canvas, so this must not run on a
    // frame where it is not needed.
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
  }

  /** Clear and re-apply the dpr transform. Call once at the top of each frame. */
  begin(): void {
    const { c } = this;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.lineCap = 'round';
    c.lineJoin = 'round';
  }
}

const MAX_SIDE = 8192;
const clampSize = (n: number): number =>
  !Number.isFinite(n) || n < 0 ? 0 : n > MAX_SIDE ? MAX_SIDE : Math.round(n);

const STYLE_ID = 'cursorkit-hide-native';

/**
 * Hides the native cursor document-wide.
 *
 * `!important` on a universal selector is heavy-handed, but anything narrower
 * loses to the `cursor: pointer` that every UI library sets on its buttons. The
 * `ignore` selector carves out escape hatches, and `restoreNativeCursor` is
 * called from the engine's error handler so a crash can never leave a visitor
 * with no pointer at all.
 */
export function hideNativeCursor(ignore: string): void {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;

  // Both rules carry `!important`, so the winner is decided by specificity
  // alone. The hide rule is (0,1,1) — `html` plus `.cursorkit-on` plus `*`.
  // The escape hatches must therefore be prefixed with the same scope to
  // reach (0,2,1); a bare `[data-cursor="native"]` is only (0,1,0) and loses,
  // which leaves the element with no cursor at all rather than the native one.
  const scope = 'html.cursorkit-on ';
  const restore = (sel: string) => `${scope}${sel},${scope}${sel} *`;

  const hatches = [restore('[data-cursor="native"]')];
  if (ignore) hatches.push(restore(ignore));

  el.textContent =
    'html.cursorkit-on,html.cursorkit-on *,' +
    'html.cursorkit-on *::before,html.cursorkit-on *::after{cursor:none!important}' +
    `${hatches.join(',')}{cursor:auto!important}`;

  document.head.appendChild(el);
  document.documentElement.classList.add('cursorkit-on');
}

export function restoreNativeCursor(): void {
  document.documentElement.classList.remove('cursorkit-on');
  document.getElementById(STYLE_ID)?.remove();
}
