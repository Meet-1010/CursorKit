import { clamp } from '@ck/math';
import type { BlendMode, Options } from './types';

export const DEFAULTS: Options = {
  style: 'dot-ring',
  click: 'ripple-clean',
  hover: 'scale-expand',
  color: 'ffffff',
  color2: '',
  size: 1,
  speed: 1,
  opacity: 1,
  blend: 'normal',
  dark: true,
  respectReducedMotion: true,
  touch: false,
  adapt: true,
  zIndex: 2147483000,
  ignore: '',
};

const BLENDS: BlendMode[] = [
  'normal',
  'difference',
  'exclusion',
  'screen',
  'multiply',
  'overlay',
  'lighten',
  'hard-light',
];

const num = (v: string | null, lo: number, hi: number, fallback: number): number => {
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? clamp(n, lo, hi) : fallback;
};

const bool = (v: string | null, fallback: boolean): boolean => {
  if (v == null || v === '') return fallback;
  return v !== '0' && v !== 'false' && v !== 'no';
};

/** Hex colour without the `#`, since `#` would terminate a query string. */
const colour = (v: string | null, fallback: string): string => {
  if (!v) return fallback;
  const h = v.replace(/^#/, '').trim();
  return /^[0-9a-f]{3,8}$/i.test(h) ? h : fallback;
};

/**
 * Reads config from a URLSearchParams-like source. Unknown keys are ignored and
 * every value is clamped — an embed script must never break the host page
 * because someone typo'd `size=999`.
 */
export function fromParams(q: URLSearchParams, base: Partial<Options> = {}): Options {
  const d = { ...DEFAULTS, ...base };
  const g = (k: string) => q.get(k);
  const blendRaw = (g('blend') || '') as BlendMode;
  return {
    style: (g('style') || d.style).trim(),
    click: (g('click') || d.click).trim(),
    hover: (g('hover') || d.hover).trim(),
    color: colour(g('color'), d.color),
    color2: colour(g('color2'), d.color2),
    size: num(g('size'), 0.4, 3, d.size),
    speed: num(g('speed'), 0.25, 3, d.speed),
    opacity: num(g('opacity'), 0.05, 1, d.opacity),
    blend: BLENDS.indexOf(blendRaw) >= 0 ? blendRaw : d.blend,
    dark: bool(g('dark'), d.dark),
    // `motion=full` opts out of the reduced-motion downgrade. Reading it as an
    // explicit opt-out keeps "respect the OS" the behaviour you get by default.
    respectReducedMotion: g('motion') === 'full' ? false : d.respectReducedMotion,
    touch: bool(g('touch'), d.touch),
    adapt: bool(g('adapt'), d.adapt),
    zIndex: num(g('z'), 0, 2147483647, d.zIndex),
    ignore: (g('ignore') || d.ignore).trim(),
  };
}

/** Serialise back to a query string, omitting anything left at its default. */
export function toParams(o: Partial<Options>): string {
  const q = new URLSearchParams();
  const put = (k: string, v: string | number | boolean, def: string | number | boolean) => {
    if (v === undefined || v === null || v === def) return;
    q.set(k, String(v));
  };
  put('style', o.style ?? DEFAULTS.style, DEFAULTS.style);
  put('click', o.click ?? DEFAULTS.click, DEFAULTS.click);
  put('hover', o.hover ?? DEFAULTS.hover, DEFAULTS.hover);
  put('color', (o.color ?? DEFAULTS.color).replace(/^#/, ''), DEFAULTS.color);
  if (o.color2) q.set('color2', o.color2.replace(/^#/, ''));
  put('size', round(o.size ?? 1), 1);
  put('speed', round(o.speed ?? 1), 1);
  put('opacity', round(o.opacity ?? 1), 1);
  put('blend', o.blend ?? DEFAULTS.blend, DEFAULTS.blend);
  if (o.dark === false) q.set('dark', '0');
  if (o.adapt === false) q.set('adapt', '0');
  return q.toString();
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Finds the script tag that loaded us and reads its query string. Falls back to
 * scanning for any `embed.js` when `currentScript` is unavailable (async
 * injection, some CMS wrappers).
 */
export function readScriptOptions(): Options {
  let src = '';
  let el = (document.currentScript as HTMLScriptElement) || null;
  if (!el) {
    const all = document.querySelectorAll<HTMLScriptElement>('script[src*="embed.js"]');
    el = all[all.length - 1] || null;
  }
  if (el) src = el.src || '';

  let q: URLSearchParams;
  try {
    q = new URL(src, location.href).searchParams;
  } catch {
    q = new URLSearchParams();
  }

  // `data-*` attributes win over query params: they are easier to template
  // server-side and easier to read in someone else's HTML.
  const base: Partial<Options> = {};
  if (el?.dataset) {
    const ds = el.dataset;
    for (const [key, val] of Object.entries(ds)) {
      if (val != null && val !== '') q.set(key, val);
    }
  }
  return fromParams(q, base);
}

export function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Devices with no real pointer get nothing — and keep their native cursor. */
export function hasFinePointer(): boolean {
  if (typeof matchMedia !== 'function') return true;
  return matchMedia('(hover: hover) and (pointer: fine)').matches;
}
