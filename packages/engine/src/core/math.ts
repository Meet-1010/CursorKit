/**
 * Shared math for every cursor style and click effect.
 *
 * This module is special: in a full bundle it is inlined, but when styles are
 * compiled as standalone CDN chunks it is swapped for `math-shim.ts`, which
 * reads the same functions off the already-loaded core. Everything exported
 * here must therefore stay a plain value — no classes relying on `instanceof`
 * across bundles, no module-level mutable state.
 */

export const TAU = Math.PI * 2;
export const HALF_PI = Math.PI / 2;

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Frame-rate independent exponential smoothing. `lambda` is the rate of
 * approach in units of e-folds per second: 10 is a snappy follow, 3 is a long
 * luxurious lag. Unlike `lerp(a, b, 0.1)` in a raf loop, this produces the same
 * motion at 60Hz and 144Hz.
 */
export const damp = (a: number, b: number, lambda: number, dt: number): number =>
  lerp(a, b, 1 - Math.exp(-lambda * dt));

/**
 * A point that chases a target with exponential lag — the single most reused
 * piece of behaviour in the library, so it lives in the shared runtime rather
 * than being re-declared by every style that needs a trailing ring.
 */
export interface Lag {
  x: number;
  y: number;
  init: boolean;
}

export const newLag = (): Lag => ({ x: 0, y: 0, init: false });

/** Snaps on the first frame so a fresh cursor never flies in from the origin. */
export function follow(s: Lag, x: number, y: number, rate: number, dt: number): void {
  if (!s.init) {
    s.x = x;
    s.y = y;
    s.init = true;
    return;
  }
  s.x = damp(s.x, x, rate, dt);
  s.y = damp(s.y, y, rate, dt);
}

export const smoothstep = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
export const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);
export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInCubic = (t: number): number => t * t * t;
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Overshoots past 1 then settles — good for click pops. */
export const easeOutBack = (t: number, overshoot = 1.7): number => {
  const c = overshoot + 1;
  return 1 + c * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
};

/** Decaying sine, for elastic snaps. Returns ~0 at t=0 and t=1. */
export const elasticPulse = (t: number, freq = 3, decay = 6): number =>
  Math.sin(t * TAU * freq) * Math.exp(-t * decay);

export const dist = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.hypot(x2 - x1, y2 - y1);

/** Shortest signed angular difference from `a` to `b`, in (-PI, PI]. */
export const angleDelta = (a: number, b: number): number => {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};

/** Angle smoothing that takes the short way around the circle. */
export const dampAngle = (a: number, b: number, lambda: number, dt: number): number =>
  a + angleDelta(a, b) * (1 - Math.exp(-lambda * dt));

/** Deterministic PRNG. Same seed, same visuals — important for previews. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap 1D value noise — smooth, deterministic, no gradient tables. */
export function noise1(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => {
    const s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  };
  return lerp(h(i), h(i + 1), smoothstep(f)) * 2 - 1;
}

/* ------------------------------------------------------------------ color -- */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Accepts `f0f`, `ff00ff`, `#ff00ff`, `ff00ff80`. Never throws. */
export function parseHex(input: string, fallback: RGB = { r: 255, g: 255, b: 255 }): RGB {
  let h = String(input || '').trim().replace(/^#/, '');
  if (h.length === 3 || h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6 && h.length !== 8) return fallback;
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return fallback;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export const rgba = (c: RGB, alpha = 1): string =>
  `rgba(${c.r},${c.g},${c.b},${alpha < 0 ? 0 : alpha > 1 ? 1 : alpha})`;

export const hex = (c: RGB): string =>
  '#' + ((1 << 24) | (c.r << 16) | (c.g << 8) | c.b).toString(16).slice(1);

export const mixRGB = (a: RGB, b: RGB, t: number): RGB => ({
  r: Math.round(lerp(a.r, b.r, t)),
  g: Math.round(lerp(a.g, b.g, t)),
  b: Math.round(lerp(a.b, b.b, t)),
});

/** Fast perceptual-ish luminance, 0–1. Good enough for picking light vs dark. */
export const luminance = (c: RGB): number =>
  (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;

/** WCAG relative luminance — gamma-corrected, for real contrast maths. */
export function relLuminance(c: RGB): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

/** WCAG contrast ratio between two colours, 1–21. */
export function contrast(a: RGB, b: RGB): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
  else if (max === G) h = ((B - R) / d + 2) / 6;
  else h = ((R - G) / d + 4) / 6;
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number): number => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return {
    r: Math.round(hue(h + 1 / 3) * 255),
    g: Math.round(hue(h) * 255),
    b: Math.round(hue(h - 1 / 3) * 255),
  };
}

/**
 * Nudges `fg` until it has at least `target` contrast against `bg`, keeping
 * hue and saturation.
 *
 * Lightness is what moves, not hue, because the colour someone chose is usually
 * a brand colour — turning their magenta cursor white to fix contrast solves the
 * legibility problem by throwing away the thing they asked for. Pushing the same
 * magenta lighter or darker keeps it recognisably theirs.
 *
 * Direction is chosen by which way has more headroom, so a mid-grey backdrop
 * resolves to whichever side the colour can actually reach.
 */
export function adaptContrast(fg: RGB, bg: RGB, target = 3): RGB {
  if (contrast(fg, bg) >= target) return fg;

  const hsl = rgbToHsl(fg);
  const bgL = relLuminance(bg);
  // More room to go lighter than darker? Then go lighter.
  const up = bgL < 0.18;
  let best = fg;
  let bestRatio = contrast(fg, bg);

  // Walk lightness in small steps and stop at the first value that clears the
  // bar. Sixteen steps is imperceptible granularity and costs nothing.
  for (let i = 1; i <= 16; i++) {
    const l = clamp01(up ? hsl.l + i * 0.0625 : hsl.l - i * 0.0625);
    const candidate = hslToRgb({ ...hsl, l });
    const ratio = contrast(candidate, bg);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = candidate;
    }
    if (ratio >= target) return candidate;
  }
  // Could not reach the target within the hue — return the best attempt rather
  // than something unrelated.
  return best;
}

export function shiftHue(c: RGB, deg: number): RGB {
  const { r, g, b } = c;
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  // Luminance-preserving hue rotation matrix.
  const m = [
    0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715,
    0.072 - cos * 0.072 + sin * 0.928,
    0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.14,
    0.072 - cos * 0.072 - sin * 0.283,
    0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715,
    0.072 + cos * 0.928 + sin * 0.072,
  ];
  return {
    r: clamp(Math.round(r * m[0] + g * m[1] + b * m[2]), 0, 255),
    g: clamp(Math.round(r * m[3] + g * m[4] + b * m[5]), 0, 255),
    b: clamp(Math.round(r * m[6] + g * m[7] + b * m[8]), 0, 255),
  };
}

/* ----------------------------------------------------------------- canvas -- */

/**
 * Traces a closed Catmull-Rom spline through `pts` as bezier segments. Used by
 * every organic shape — blobs, ribbons, ink. Points are flat [x, y, x, y, ...].
 */
export function closedSpline(c: CanvasRenderingContext2D, pts: number[]): void {
  const n = pts.length / 2;
  if (n < 3) return;
  const px = (i: number) => pts[((i % n) + n) % n * 2];
  const py = (i: number) => pts[((i % n) + n) % n * 2 + 1];
  c.beginPath();
  c.moveTo((px(0) + px(-1)) / 2, (py(0) + py(-1)) / 2);
  for (let i = 0; i < n; i++) {
    const cx = px(i);
    const cy = py(i);
    const nx = (px(i) + px(i + 1)) / 2;
    const ny = (py(i) + py(i + 1)) / 2;
    c.quadraticCurveTo(cx, cy, nx, ny);
  }
  c.closePath();
}

/** Open smooth polyline through points, for trails. */
export function polyline(c: CanvasRenderingContext2D, pts: number[]): void {
  const n = pts.length / 2;
  if (n < 2) return;
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  if (n === 2) {
    c.lineTo(pts[2], pts[3]);
    return;
  }
  for (let i = 1; i < n - 1; i++) {
    const x = pts[i * 2];
    const y = pts[i * 2 + 1];
    c.quadraticCurveTo(x, y, (x + pts[i * 2 + 2]) / 2, (y + pts[i * 2 + 3]) / 2);
  }
  c.lineTo(pts[(n - 1) * 2], pts[(n - 1) * 2 + 1]);
}

/** Regular n-gon path centred at origin, first vertex at `rot`. */
export function ngon(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  sides: number,
  rot = -HALF_PI,
): void {
  c.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * TAU;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

/** Star with `points` tips, alternating outer/inner radius. */
export function star(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  outer: number,
  inner: number,
  points: number,
  rot = -HALF_PI,
): void {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i / (points * 2)) * TAU;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

/**
 * Four-point sparkle (the "shine" glyph) — concave diamond. Reads far better
 * than a 5-point star at cursor scale.
 */
export function sparkle(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot = 0,
): void {
  const k = r * 0.28;
  c.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = rot + (i / 4) * TAU;
    const b = a + Math.PI / 4;
    const tx = x + Math.cos(a) * r;
    const ty = y + Math.sin(a) * r;
    if (i === 0) c.moveTo(tx, ty);
    else c.lineTo(tx, ty);
    c.quadraticCurveTo(x + Math.cos(b) * k, y + Math.sin(b) * k, x + Math.cos(b + 0) * k, y + Math.sin(b) * k);
    const na = rot + ((i + 1) / 4) * TAU;
    c.quadraticCurveTo(
      x + Math.cos(b) * k,
      y + Math.sin(b) * k,
      x + Math.cos(na) * r,
      y + Math.sin(na) * r,
    );
  }
  c.closePath();
}

/** Rounded-rect path. Canvas `roundRect` is not universal enough to rely on. */
export function roundRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}
