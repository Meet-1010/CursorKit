import { DEFAULTS, toParams, type BlendMode, type Options } from '@cursorkit/engine';

/** The subset of engine options the builder exposes. */
export type Config = Pick<
  Options,
  'style' | 'click' | 'hover' | 'color' | 'color2' | 'size' | 'speed' | 'opacity' | 'blend' | 'dark'
>;

/**
 * The origin baked into every copyable embed tag.
 *
 * This has to be the domain the site is actually deployed on, or every tag a
 * visitor copies points at a host that will not serve them. Vercel exposes the
 * deployment URL as `VERCEL_URL` (without a scheme); a custom domain should be
 * set explicitly via `NEXT_PUBLIC_SITE_ORIGIN`.
 *
 * `NEXT_PUBLIC_` is required: this value is read during client rendering, and
 * anything without that prefix is stripped from the browser bundle.
 */
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ||
  (process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'https://cursorkit.io');

/**
 * What a first-time visitor sees. Chosen to demonstrate lag, click feedback and
 * hover response at once, without being so loud it distracts from the copy.
 */
export const SITE_DEFAULT: Config = {
  style: 'dot-ring',
  click: 'ripple-clean',
  hover: 'scale-expand',
  color: 'ffa132',
  color2: 'ffd9a0',
  size: 1,
  speed: 1,
  opacity: 1,
  blend: 'normal',
  dark: true,
};

export const BUILDER_DEFAULT: Config = {
  ...SITE_DEFAULT,
  style: 'magnetic-blob',
  click: 'shockwave',
  hover: 'magnet',
};

export const BLEND_MODES: BlendMode[] = [
  'normal',
  'difference',
  'exclusion',
  'screen',
  'multiply',
  'overlay',
  'lighten',
  'hard-light',
];

export const toQuery = (cfg: Config): string => toParams(cfg);

/** Reads a config out of a URLSearchParams, falling back per-field. */
export function fromQuery(sp: URLSearchParams, base: Config = BUILDER_DEFAULT): Config {
  const numOr = (key: string, fallback: number, lo: number, hi: number) => {
    const raw = sp.get(key);
    if (raw === null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : fallback;
  };
  const hexOr = (key: string, fallback: string) => {
    const raw = (sp.get(key) || '').replace(/^#/, '');
    return /^[0-9a-f]{3,8}$/i.test(raw) ? raw : fallback;
  };
  const blendRaw = sp.get('blend') as BlendMode | null;
  return {
    style: sp.get('style') || base.style,
    click: sp.get('click') || base.click,
    hover: sp.get('hover') || base.hover,
    color: hexOr('color', base.color),
    color2: hexOr('color2', base.color2),
    size: numOr('size', base.size, 0.4, 3),
    speed: numOr('speed', base.speed, 0.25, 3),
    opacity: numOr('opacity', base.opacity, 0.05, 1),
    blend: blendRaw && BLEND_MODES.includes(blendRaw) ? blendRaw : base.blend,
    dark: sp.get('dark') === null ? base.dark : sp.get('dark') !== '0',
  };
}

/** The line a developer actually pastes. */
export function embedTag(cfg: Config, origin = SITE_ORIGIN): string {
  const q = toQuery(cfg);
  return `<script src="${origin}/embed.js${q ? '?' + q : ''}"></script>`;
}

export function embedUrl(cfg: Config, origin = SITE_ORIGIN): string {
  const q = toQuery(cfg);
  return `${origin}/embed.js${q ? '?' + q : ''}`;
}

export { DEFAULTS };
