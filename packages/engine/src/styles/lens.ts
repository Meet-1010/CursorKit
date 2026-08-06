import { damp } from '@ck/math';
import type { Ctx, CursorStyle } from '../core/types';

/**
 * Lens Ball — a solid glass sphere that actually refracts the page.
 *
 * Every other style in this library is canvas. This one cannot be: a canvas
 * overlay has no access to the pixels beneath it, and the whole point of a
 * glass ball is that it *bends what is behind it*. Blurring a disc and calling
 * it glass is what the removed glassmorphic styles did, and it never read as
 * glass — a blur throws information away, where a lens moves it.
 *
 * So this is one DOM disc carrying `backdrop-filter: url(#…)`, where the filter
 * is an `feDisplacementMap` driven by a displacement texture generated at boot.
 * The texture encodes, per pixel, where the sphere should sample from:
 *
 *     source_r(u) = R · (a·u + (1 − a)·u^g)        u = r / R, normalised radius
 *
 * `a` alone would be a plain magnifier — a uniform 1/a zoom. The `u^g` term is
 * what makes it a *sphere*: it is negligible in the middle and dominates near
 * the edge, so the rim samples from far outside itself and the background piles
 * up into the thin compressed band you see around a real lens ball. Centre
 * magnification is `1/a`; rim compression is `a + (1 − a)·g`.
 *
 * The profile is deliberately monotonic. The physically-correct refraction of a
 * ball lens folds — it inverts the image past the critical angle — and a fold
 * in a displacement map is not a pretty caustic, it is a smeared tear. Real
 * glass gets away with it because it also reflects; a displacement map cannot,
 * so the profile stops just short of folding.
 *
 * Dispersion is three passes at slightly different scales, recombined per
 * channel. That is the cyan/amber fringing on high-contrast edges, and it is
 * the single detail that stops the effect reading as "zoomed screenshot".
 */

/** Base diameter in css px, before `size` and hover scaling. */
const D = 96;
/** Displacement texture resolution. Higher than `D` so scaling up stays smooth. */
const RES = 256;

const A = 0.68; // → 1.47× magnification through the middle
const G = 5.0; // → 2.28× compression at the rim
const CA = 0.025; // dispersion, as a fraction of the displacement scale

/**
 * Whether the browser can reference an SVG filter from `backdrop-filter`.
 *
 * Chromium can; Safari and Firefox support `backdrop-filter` but only the
 * shorthand functions, so `url()` silently does nothing there. Rather than ship
 * them an undistorted disc, they get a frosted ball — less impressive, but
 * still unmistakably glass, and it degrades on the one axis nobody can see is
 * missing unless they have Chrome open next to it.
 */
const CAN_REFRACT =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('backdrop-filter', 'url(#a)');

/** Built once per page and shared: it depends on nothing instance-specific. */
let texture: { url: string; scale: number } | null = null;

function displacementTexture(): { url: string; scale: number } {
  if (texture) return texture;

  const cv = document.createElement('canvas');
  cv.width = cv.height = RES;
  const c = cv.getContext('2d')!;
  const img = c.createImageData(RES, RES);
  const d = img.data;
  const R = RES / 2;

  // `scale` on feDisplacementMap is the full range the map can express, so it
  // has to cover the largest offset the profile actually produces — measured
  // rather than derived, because the maximum of u − (a·u + (1−a)·u^g) has no
  // tidy closed form.
  let peak = 0;
  for (let i = 0; i <= 256; i++) {
    const u = i / 256;
    peak = Math.max(peak, Math.abs(u - (A * u + (1 - A) * Math.pow(u, G))) * R);
  }
  const scale = peak * 2 || 1;

  for (let y = 0; y < RES; y++) {
    for (let x = 0; x < RES; x++) {
      const nx = (x + 0.5 - R) / R;
      const ny = (y + 0.5 - R) / R;
      const u = Math.hypot(nx, ny);
      const i = (y * RES + x) * 4;
      let dx = 0;
      let dy = 0;
      if (u <= 1 && u > 1e-6) {
        const off = (A * u + (1 - A) * Math.pow(u, G) - u) * R; // negative: sample inward
        dx = (nx / u) * off;
        dy = (ny / u) * off;
      }
      // 128 is "no displacement"; the filter reads R as x and G as y.
      d[i] = 128 + (dx / scale) * 255;
      d[i + 1] = 128 + (dy / scale) * 255;
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  texture = { url: cv.toDataURL(), scale };
  return texture;
}

let uid = 0;

interface LensState {
  lens: HTMLElement | null;
  gloss: HTMLElement | null;
  svg: SVGSVGElement | null;
  /** Eased size, so hover and press are a swell rather than a jump. */
  k: number;
  built: boolean;
  /** False when drawing into a laid-out preview canvas rather than the overlay. */
  fixed: boolean;
}

/** Bright rim plus one specular. Without the rim the ball vanishes on white. */
const GLOSS =
  'radial-gradient(circle at 33% 25%,rgba(255,255,255,.9) 0%,rgba(255,255,255,.35) 8%,rgba(255,255,255,0) 20%),' +
  'radial-gradient(circle at 50% 50%,rgba(255,255,255,.10) 0%,rgba(255,255,255,.06) 52%,' +
  'rgba(255,255,255,.30) 80%,rgba(255,255,255,.66) 93%,rgba(255,255,255,.30) 99%,rgba(255,255,255,0) 100%)';

function build(ctx: Ctx, s: LensState): void {
  s.built = true;
  const canvas = ctx.c.canvas;
  // The overlay canvas is fixed to the viewport; a preview canvas is laid out
  // in the page. Match whichever we are drawing into, so one style serves both
  // the real cursor and the gallery cards.
  const fixed = getComputedStyle(canvas).position === 'fixed';
  const parent = (fixed ? document.body : canvas.offsetParent || canvas.parentElement) as
    | HTMLElement
    | null;
  if (!parent) return;

  const id = `ck-lens-${++uid}`;
  const { url, scale } = displacementTexture();

  if (CAN_REFRACT) {
    // Filter references resolve within the element's own tree, so the defs must
    // live in the same root — the embeddable dashboard mounts in a shadow root.
    const root = parent.getRootNode() as Document | ShadowRoot;
    const host = (root as ShadowRoot).host ? (root as ShadowRoot) : document.body;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
    const pass = (n: string, mul: number) =>
      `<feDisplacementMap in="SourceGraphic" in2="m" scale="${(scale * mul).toFixed(2)}" ` +
      `xChannelSelector="R" yChannelSelector="G" result="${n}"/>`;
    // Isolate one channel from each pass, then screen them back together.
    const only = (i: string, o: string, m: string) =>
      `<feColorMatrix in="${i}" result="${o}" type="matrix" values="${m} 0 0 0 1 0"/>`;
    const R_ONLY = '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0 ';
    const G_ONLY = '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0 ';
    const B_ONLY = '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0 ';
    svg.innerHTML =
      `<filter id="${id}" x="0" y="0" width="${D}" height="${D}" filterUnits="userSpaceOnUse" ` +
      `primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">` +
      `<feImage href="${url}" x="0" y="0" width="${D}" height="${D}" result="m"/>` +
      pass('r', 1 + CA) +
      pass('g', 1) +
      pass('b', 1 - CA) +
      only('r', 'cr', R_ONLY) +
      only('g', 'cg', G_ONLY) +
      only('b', 'cb', B_ONLY) +
      `<feBlend in="cr" in2="cg" mode="screen" result="rg"/>` +
      `<feBlend in="rg" in2="cb" mode="screen"/>` +
      `</filter>`;
    (host as ParentNode).appendChild(svg);
    s.svg = svg;
  }

  const filter = CAN_REFRACT
    ? `blur(.35px) url(#${id}) brightness(1.05) saturate(1.06)`
    : 'blur(3px) brightness(1.06) saturate(1.15)';

  // One below the canvas: the cursor's own painting must sit on top of the
  // glass, and — more importantly — must not be part of what the glass samples.
  const box =
    `position:${fixed ? 'fixed' : 'absolute'};left:0;top:0;width:${D}px;height:${D}px;` +
    `border-radius:50%;pointer-events:none;will-change:transform;opacity:0;` +
    (fixed ? `z-index:${ctx.o.zIndex - 1};` : '');

  const lens = document.createElement('div');
  lens.setAttribute('data-cursorkit', 'lens');
  lens.setAttribute('aria-hidden', 'true');
  lens.style.cssText = `${box}backdrop-filter:${filter};-webkit-backdrop-filter:${filter};`;

  // Light only. An inset *dark* shadow is the obvious way to suggest volume and
  // it is a trap: over dark content it stops reading as shading and becomes a
  // grey crescent floating inside the ball, which looks like a second, broken
  // shape rather than one sphere. Everything here adds light or nothing.
  const gloss = document.createElement('div');
  gloss.setAttribute('aria-hidden', 'true');
  gloss.style.cssText = `${box}background:${GLOSS};`;

  parent.appendChild(lens);
  parent.appendChild(gloss);
  s.lens = lens;
  s.gloss = gloss;
  s.fixed = fixed;
}

export const lensBall: CursorStyle<LensState> = {
  id: 'lens-ball',
  name: 'Lens Ball',
  category: 'fluid',
  blurb: 'A glass sphere that magnifies and disperses the page beneath it.',
  state: () => ({ lens: null, gloss: null, svg: null, k: 1, built: false, fixed: true }),

  draw(ctx, s) {
    if (!s.built) build(ctx, s);
    const { lens, gloss } = s;
    if (!lens || !gloss) return;

    const { p } = ctx;
    // Press pulls the ball in slightly, the way a bead does against a surface.
    s.k = damp(s.k, ctx.scale * (1 - p.press * 0.1), 12, ctx.dt);

    const canvas = ctx.c.canvas;
    const ox = s.fixed ? 0 : canvas.offsetLeft;
    const oy = s.fixed ? 0 : canvas.offsetTop;
    const t = `translate3d(${ox + p.x - D / 2}px,${oy + p.y - D / 2}px,0) scale(${s.k.toFixed(4)})`;
    const a = String(ctx.alpha);

    lens.style.transform = t;
    gloss.style.transform = t;
    lens.style.opacity = a;
    gloss.style.opacity = a;
  },

  hidden(s) {
    if (s.lens) s.lens.style.opacity = '0';
    if (s.gloss) s.gloss.style.opacity = '0';
  },

  dispose(s) {
    s.lens?.remove();
    s.gloss?.remove();
    s.svg?.remove();
    s.lens = s.gloss = null;
    s.svg = null;
    s.built = false;
  },
};

export const lensStyles: CursorStyle<any>[] = [lensBall];
