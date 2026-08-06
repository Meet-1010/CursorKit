import {
  TAU,
  clamp,
  damp,
  type Lag,
  follow,
  lerp,
  luminance,
  mixRGB,
  newLag,
  rgba,
  roundRect,
} from '@ck/math';
import type { Ctx, CursorStyle } from '../core/types';

/**
 * Neumorphic styles — the page skin deforming under an invisible finger.
 *
 * The first attempt at this category drew soft-UI *objects* that floated over
 * the page, and it could never have worked. Neumorphism's entire premise is
 * that everything is one continuous surface: a shape is legible only because it
 * is the same colour as its ground, lit from one side and shadowed on the
 * other. A soft-UI chip sitting on a page it does not match is just a grey blob
 * with a drop shadow, which is what those were.
 *
 * The fix is to stop drawing objects. These are **deformations of the page
 * itself** — dimples, ridges, bulges — and they are drawn in the colour of
 * whatever the cursor is actually over, read live from the DOM. That is what
 * makes the category work anywhere rather than only on one exact background.
 *
 * Two consequences worth knowing:
 *
 *   The configured colour is ignored on purpose. There is no colour to choose:
 *   the surface is whatever the page is. `col` is used only as a fallback when
 *   the backdrop cannot be read — over an image or a gradient — and in that
 *   case these styles honestly degrade, because there is no real surface to
 *   deform.
 *
 *   Press inverts. A raised bump becomes a pressed dimple by swapping the
 *   shadow offsets and nothing else, which is exactly how the language encodes
 *   interaction.
 */

const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };

/**
 * The surface colour to deform: the real page beneath the cursor.
 *
 * Falls back to the configured colour when the page cannot be read, since a
 * guess would be worse than an honest, if generic, surface.
 */
const surfaceOf = (ctx: Ctx) => (ctx.backdropKnown ? ctx.backdrop : ctx.rawCol);

/**
 * Shadow pair tuned to the surface's own lightness.
 *
 * On a light surface the highlight is white and the shadow is a muted version
 * of the surface hue. On a dark surface white would blow out, so the highlight
 * becomes a lifted tint of the surface instead. Using one fixed pair — the
 * usual `#fff` / `#000` — is why most soft-UI breaks the moment the background
 * is not pale grey.
 */
function tones(surface: { r: number; g: number; b: number }): {
  hi: string;
  lo: string;
} {
  const l = luminance(surface);
  return {
    hi: rgba(mixRGB(surface, WHITE, l > 0.45 ? 0.95 : 0.34), l > 0.45 ? 0.95 : 0.85),
    lo: rgba(mixRGB(surface, BLACK, l > 0.45 ? 0.42 : 0.68), l > 0.45 ? 0.5 : 0.9),
  };
}

/**
 * Draws a deformation of the surface.
 *
 * `depth` is signed: positive bulges out, negative presses in. The only
 * difference between the two is which corner the highlight lands on, which is
 * the whole trick and the reason press states cost nothing here.
 */
function deform(
  ctx: Ctx,
  path: () => void,
  cx: number,
  cy: number,
  radius: number,
  depth: number,
): void {
  const { c } = ctx;
  const surface = surfaceOf(ctx);
  const { hi, lo } = tones(surface);
  const off = radius * 0.3 * Math.sign(depth || 1) * Math.min(Math.abs(depth), 1.4);
  const blur = radius * 0.66;

  c.save();
  c.shadowColor = lo;
  c.shadowBlur = blur;
  c.shadowOffsetX = off;
  c.shadowOffsetY = off;
  c.fillStyle = rgba(surface, 1);
  path();
  c.fill();
  c.restore();

  c.save();
  c.shadowColor = hi;
  c.shadowBlur = blur;
  c.shadowOffsetX = -off;
  c.shadowOffsetY = -off;
  c.fillStyle = rgba(surface, 1);
  path();
  c.fill();
  c.restore();

  c.fillStyle = rgba(surface, 1);
  path();
  c.fill();

  // Internal shading across the light axis. At cursor scale this does more work
  // than either cast shadow, because the cast shadows have only a few pixels to
  // live in — the textbook soft-UI numbers assume a 90px button, not a 30px
  // cursor, and shrinking them proportionally makes the shape vanish.
  c.save();
  path();
  c.clip();
  const g = c.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  const raised = depth >= 0;
  g.addColorStop(0, raised ? hi : lo);
  g.addColorStop(0.5, rgba(surface, 0));
  g.addColorStop(1, raised ? lo : hi);
  c.globalAlpha *= 0.55;
  c.fillStyle = g;
  c.fillRect(cx - radius * 2, cy - radius * 2, radius * 4, radius * 4);
  c.restore();
}

export const dimple: CursorStyle<Lag> = {
  id: 'neu-dimple',
  name: 'Dimple',
  category: 'neumorphic',
  blurb: 'A soft dent travelling under the page surface. Deepens when you press.',
  state: newLag,
  draw(ctx, s) {
    const { c, p, scale, dt } = ctx;
    follow(s, p.x, p.y, 18, dt);
    const r = 20 * scale * (1 + p.hoverAmt * 0.3);
    deform(ctx, () => {
      c.beginPath();
      c.arc(s.x, s.y, r, 0, TAU);
    }, s.x, s.y, r, -1 - p.press * 0.5);
  },
};

export const bump: CursorStyle<Lag> = {
  id: 'neu-bump',
  name: 'Bump',
  category: 'neumorphic',
  blurb: 'The page bulging outward, as though pushed from behind. Inverts on click.',
  state: newLag,
  draw(ctx, s) {
    const { c, p, scale, dt } = ctx;
    follow(s, p.x, p.y, 18, dt);
    const r = 20 * scale * (1 + p.hoverAmt * 0.3);
    // Press flips the sign — one number, two states.
    deform(ctx, () => {
      c.beginPath();
      c.arc(s.x, s.y, r, 0, TAU);
    }, s.x, s.y, r, p.press > 0.5 ? -1 : 1);
  },
};

export const ridge: CursorStyle<Lag> = {
  id: 'neu-ridge',
  name: 'Ridge',
  category: 'neumorphic',
  blurb: 'A raised welt in the surface, stretching along the direction of travel.',
  state: newLag,
  draw(ctx, s) {
    const { c, p, scale, dt } = ctx;
    follow(s, p.x, p.y, 16, dt);
    const stretch = 1 + clamp(p.speed / 1500, 0, 1.4);
    const w = 26 * scale * stretch;
    const h = 22 * scale / Math.sqrt(stretch);

    c.save();
    c.translate(s.x, s.y);
    c.rotate(p.angle);
    deform(ctx, () => roundRect(c, -w / 2, -h / 2, w, h, h / 2), 0, 0, h / 2, 1 - p.press * 2);
    c.restore();
  },
};

export const well: CursorStyle<Lag> = {
  id: 'neu-well',
  name: 'Well',
  category: 'neumorphic',
  blurb: 'A deep recess with a raised rim — two opposing deformations at once.',
  state: newLag,
  draw(ctx, s) {
    const { c, p, scale, dt } = ctx;
    follow(s, p.x, p.y, 15, dt);
    const r = 24 * scale * (1 + p.hoverAmt * 0.26);

    deform(ctx, () => {
      c.beginPath();
      c.arc(s.x, s.y, r, 0, TAU);
    }, s.x, s.y, r, 1);
    // The inner recess always disagrees with the rim. That disagreement is what
    // makes depth legible at this size.
    deform(ctx, () => {
      c.beginPath();
      c.arc(s.x, s.y, r * 0.58, 0, TAU);
    }, s.x, s.y, r * 0.58, -1 - p.press);
  },
};

export const softButton: CursorStyle<Lag> = {
  id: 'neu-button',
  name: 'Soft Button',
  category: 'neumorphic',
  blurb: 'A squircle moulded from the page, bottoming out under the click.',
  state: newLag,
  draw(ctx, s) {
    const { c, p, scale, dt } = ctx;
    follow(s, p.x, p.y, 17, dt);
    const w = 38 * scale * (1 + p.hoverAmt * 0.22);
    deform(
      ctx,
      () => roundRect(c, s.x - w / 2, s.y - w / 2, w, w, w * 0.3),
      s.x, s.y, w / 2,
      1 - p.press * 2,
    );
  },
};

export const crease: CursorStyle<Lag & { a: number }> = {
  id: 'neu-crease',
  name: 'Crease',
  category: 'neumorphic',
  blurb: 'A fold line pressed into the surface, turning to follow your path.',
  state: () => ({ ...newLag(), a: 0 }),
  draw(ctx, s) {
    const { c, p, scale, dt } = ctx;
    follow(s, p.x, p.y, 20, dt);
    if (p.speed > 40) s.a = damp(s.a, p.angle, 9, dt);
    const len = lerp(30, 52, clamp(p.speed / 1400, 0, 1)) * scale;
    const t = 7 * scale;

    c.save();
    c.translate(s.x, s.y);
    c.rotate(s.a);
    deform(ctx, () => roundRect(c, -len / 2, -t / 2, len, t, t / 2), 0, 0, t / 2, -1.2);
    c.restore();
  },
};

export const pebbleUnder: CursorStyle<Lag & { vx: number; vy: number }> = {
  id: 'neu-pebble',
  name: 'Pebble',
  category: 'neumorphic',
  blurb: 'A smooth stone under a taut skin, sliding with a little momentum.',
  state: () => ({ ...newLag(), vx: 0, vy: 0 }),
  draw(ctx, s) {
    const { c, p, scale, dt } = ctx;
    if (!s.init) {
      s.x = p.x;
      s.y = p.y;
      s.init = true;
    }
    // A weight under fabric lags and overshoots; a plain follow feels rigid.
    const step = Math.min(dt, 1 / 60);
    s.vx += (p.x - s.x) * 190 * step - s.vx * 15 * step;
    s.vy += (p.y - s.y) * 190 * step - s.vy * 15 * step;
    s.x += s.vx * step;
    s.y += s.vy * step;

    const sp = Math.hypot(s.vx, s.vy);
    const stretch = 1 + Math.min(sp / 2400, 0.4);
    const r = 21 * scale;
    c.save();
    c.translate(s.x, s.y);
    c.rotate(Math.atan2(s.vy, s.vx));
    c.scale(stretch, 1 / stretch);
    deform(ctx, () => {
      c.beginPath();
      c.arc(0, 0, r, 0, TAU);
    }, 0, 0, r, 1 - p.press * 2);
    c.restore();
  },
};

export const membrane: CursorStyle<Lag & { ring: number }> = {
  id: 'neu-membrane',
  name: 'Membrane',
  category: 'neumorphic',
  blurb: 'A drum skin that dents under the pointer and rings outward on click.',
  state: () => ({ ...newLag(), ring: 0 }),
  draw(ctx, s) {
    const { c, p, scale, dt } = ctx;
    follow(s, p.x, p.y, 19, dt);
    // Ring is struck by the press and decays on its own.
    if (p.press > 0.6 && s.ring < 0.1) s.ring = 1;
    s.ring = Math.max(0, s.ring - dt * 1.6);

    const r = 19 * scale;
    deform(ctx, () => {
      c.beginPath();
      c.arc(s.x, s.y, r, 0, TAU);
    }, s.x, s.y, r, -1 - p.press);

    if (s.ring > 0.01) {
      const { hi, lo } = tones(surfaceOf(ctx));
      const rr = r + (1 - s.ring) * 44 * scale;
      c.lineWidth = 3 * scale * s.ring;
      c.strokeStyle = lo;
      c.beginPath();
      c.arc(s.x, s.y, rr, 0, TAU);
      c.stroke();
      c.strokeStyle = hi;
      c.beginPath();
      c.arc(s.x, s.y, rr - 2 * scale, 0, TAU);
      c.stroke();
    }
  },
};

export const stitchLine: CursorStyle<Lag> = {
  id: 'neu-quilt',
  name: 'Quilt',
  category: 'neumorphic',
  blurb: 'Four puffed panels divided by stitched seams, like upholstery.',
  state: newLag,
  draw(ctx, s) {
    const { c, p, scale, dt } = ctx;
    follow(s, p.x, p.y, 15, dt);
    const q = 13 * scale * (1 + p.hoverAmt * 0.24);
    const gap = 1.6 * scale;

    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      const cx = s.x + dx * (q / 2 + gap);
      const cy = s.y + dy * (q / 2 + gap);
      deform(
        ctx,
        () => roundRect(c, cx - q / 2, cy - q / 2, q, q, q * 0.38),
        cx, cy, q / 2,
        1 - p.press * 2,
      );
    }
  },
};

export const softTrack: CursorStyle<Lag & { knob: number }> = {
  id: 'neu-track',
  name: 'Track',
  category: 'neumorphic',
  blurb: 'A recessed channel with a raised knob that slides to the end on press.',
  state: () => ({ ...newLag(), knob: 0 }),
  draw(ctx, s) {
    const { c, p, scale, dt } = ctx;
    follow(s, p.x, p.y, 18, dt);
    s.knob = damp(s.knob, p.down ? 1 : 0, 9, dt);
    const w = 50 * scale;
    const h = 20 * scale;

    deform(
      ctx,
      () => roundRect(c, s.x - w / 2, s.y - h / 2, w, h, h / 2),
      s.x, s.y, h / 2, -1.1,
    );
    const kx = s.x + lerp(-1, 1, s.knob) * (w / 2 - h * 0.55);
    deform(ctx, () => {
      c.beginPath();
      c.arc(kx, s.y, h * 0.55, 0, TAU);
    }, kx, s.y, h * 0.55, 1);
  },
};

export const softDial: CursorStyle<Lag & { spin: number }> = {
  id: 'neu-dial',
  name: 'Dial',
  category: 'neumorphic',
  blurb: 'A moulded dial with a debossed index mark, turning as you travel.',
  state: () => ({ ...newLag(), spin: 0 }),
  draw(ctx, s) {
    const { c, p, scale, dt } = ctx;
    follow(s, p.x, p.y, 16, dt);
    s.spin += (p.vx + p.vy) * dt * 0.0016;
    const r = 22 * scale * (1 + p.hoverAmt * 0.22);

    deform(ctx, () => {
      c.beginPath();
      c.arc(s.x, s.y, r, 0, TAU);
    }, s.x, s.y, r, 1 - p.press * 2);

    const mx = s.x + Math.cos(s.spin) * r * 0.58;
    const my = s.y + Math.sin(s.spin) * r * 0.58;
    deform(ctx, () => {
      c.beginPath();
      c.arc(mx, my, 3.6 * scale, 0, TAU);
    }, mx, my, 3.6 * scale, -1.2);
  },
};

export const softWave: CursorStyle<Lag & { t: number }> = {
  id: 'neu-wave',
  name: 'Wave',
  category: 'neumorphic',
  blurb: 'Concentric swells in the surface, breathing outward from the pointer.',
  state: () => ({ ...newLag(), t: 0 }),
  draw(ctx, s) {
    const { c, p, scale, dt, calm } = ctx;
    follow(s, p.x, p.y, 14, dt);
    if (!calm) s.t += dt * 0.8;

    // Alternating raised and recessed rings — a standing wave in the skin.
    for (let i = 2; i >= 0; i--) {
      const phase = (s.t + i / 3) % 1;
      const r = lerp(10, 32, phase) * scale;
      deform(ctx, () => {
        c.beginPath();
        c.arc(s.x, s.y, r, 0, TAU);
      }, s.x, s.y, r, (i % 2 ? 1 : -1) * (1 - phase));
    }
  },
};

export const neumorphicStyles = [
  dimple,
  bump,
  ridge,
  well,
  softButton,
  crease,
  pebbleUnder,
  membrane,
  stitchLine,
  softTrack,
  softDial,
  softWave,
];
