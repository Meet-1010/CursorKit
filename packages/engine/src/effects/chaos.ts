import {
  TAU,
  easeOutExpo,
  easeOutQuint,
  lerp,
  rgba,
  shiftHue,
  sparkle,
  star,
} from '@ck/math';
import type { ClickEffect, EffectInstance } from '../core/types';

/**
 * Chaos family — click feedback for the loud categories.
 *
 * Maximalist and brutalist styles need click effects with the same conviction,
 * and the two want opposite things: maximalism wants layered colour that stays
 * legible, brutalism wants hard shapes with no easing at all. Both live here
 * because both are about refusing restraint, and both are the wrong choice for
 * a checkout page.
 */

const INK = { r: 0, g: 0, b: 0 };
const WHITE = { r: 255, g: 255, b: 255 };

export const prismBurst: ClickEffect = {
  id: 'prism-burst',
  name: 'Prism Burst',
  family: 'chaos',
  blurb: 'Six rings expanding at different rates, each a further hue round the wheel.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.85, k: 0 }),
  draw({ c, col, scale }, e) {
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      // Different rates keep the rings separated instead of stacking into mud.
      const k = Math.min(e.k * (1 + i * 0.16), 1);
      const r = lerp(4, 70, easeOutQuint(k)) * scale;
      c.strokeStyle = rgba(shiftHue(col, i * 55), Math.pow(1 - k, 2) * 0.6);
      c.lineWidth = (3 - i * 0.35) * scale;
      c.beginPath();
      c.arc(e.x, e.y, r, 0, TAU);
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
  },
};

interface Rays extends EffectInstance {
  n: number;
  seed: number;
}

export const sunburst: ClickEffect<Rays> = {
  id: 'sunburst',
  name: 'Sunburst',
  family: 'chaos',
  blurb: 'Hard-edged rays fanning out from the click like a comic book panel.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.55, k: 0, n: 14, seed: ctx.rnd() * TAU }),
  draw({ c, col, scale }, e) {
    const r = lerp(6, 90, easeOutExpo(e.k)) * scale;
    const a = 1 - Math.pow(e.k, 2);
    c.fillStyle = rgba(col, a * 0.8);
    for (let i = 0; i < e.n; i++) {
      const a0 = e.seed + (i / e.n) * TAU;
      const wedge = (TAU / e.n) * 0.42;
      c.beginPath();
      c.moveTo(e.x, e.y);
      c.lineTo(e.x + Math.cos(a0 - wedge) * r, e.y + Math.sin(a0 - wedge) * r);
      c.lineTo(e.x + Math.cos(a0 + wedge) * r, e.y + Math.sin(a0 + wedge) * r);
      c.closePath();
      c.fill();
    }
  },
};

export const hardStamp: ClickEffect = {
  id: 'hard-stamp',
  name: 'Hard Stamp',
  family: 'chaos',
  blurb: 'A thick-bordered square slams down in three discrete steps. No easing.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.42, k: 0 }),
  draw({ c, col, scale }, e) {
    // Quantised to three frames — brutalism does not interpolate.
    const step = Math.floor(e.k * 3) / 3;
    const s = lerp(46, 20, step) * scale;
    const off = (1 - step) * 7 * scale;
    const x = Math.round(e.x - s / 2);
    const y = Math.round(e.y - s / 2);

    c.fillStyle = rgba(INK, 1 - step);
    c.fillRect(x + off, y + off, s, s);
    c.strokeStyle = rgba(col, 1 - step);
    c.lineWidth = 4 * scale;
    c.lineJoin = 'miter';
    c.strokeRect(x, y, s, s);
    c.lineJoin = 'round';
  },
};

export const noiseBlast: ClickEffect<Rays> = {
  id: 'noise-blast',
  name: 'Noise Blast',
  family: 'chaos',
  blurb: 'A field of hard square pixels scattering outward on a grid.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.5, k: 0, n: 34, seed: ctx.rnd() * 1000 }),
  draw({ c, col, col2, scale }, e) {
    const grid = 5 * scale;
    const push = easeOutQuint(e.k) * 70 * scale;
    const a = 1 - e.k;
    for (let i = 0; i < e.n; i++) {
      // Deterministic pseudo-random from the seed, so each blast is stable
      // frame to frame rather than boiling.
      const h = Math.sin(e.seed + i * 12.9898) * 43758.5453;
      const rnd = h - Math.floor(h);
      const ang = rnd * TAU;
      const d = (0.3 + rnd * 0.7) * push;
      const x = Math.round((e.x + Math.cos(ang) * d) / grid) * grid;
      const y = Math.round((e.y + Math.sin(ang) * d) / grid) * grid;
      c.fillStyle = rgba(rnd > 0.5 ? col : col2, a);
      c.fillRect(x, y, grid, grid);
    }
  },
};

interface Bits extends EffectInstance {
  bits: Array<{ a: number; sp: number; s: number; rot: number; kind: number }>;
}

export const stickerPop: ClickEffect<Bits> = {
  id: 'sticker-pop',
  name: 'Sticker Pop',
  family: 'chaos',
  blurb: 'Keyline stars and sparkles burst out, each cut with a white outline.',
  spawn: (ctx, x, y) => ({
    x, y, age: 0, life: 0.8, k: 0,
    bits: Array.from({ length: 12 }, (_, i) => ({
      a: (i / 12) * TAU + (ctx.rnd() - 0.5) * 0.4,
      sp: 120 + ctx.rnd() * 240,
      s: 5 + ctx.rnd() * 6,
      rot: ctx.rnd() * TAU,
      kind: i % 2,
    })),
  }),
  draw({ c, col, scale }, e) {
    const push = easeOutQuint(e.k);
    const a = 1 - Math.pow(e.k, 2.5);
    for (let i = 0; i < e.bits.length; i++) {
      const b = e.bits[i];
      const d = b.sp * push * scale * 0.35;
      const x = e.x + Math.cos(b.a) * d;
      const y = e.y + Math.sin(b.a) * d;
      const size = b.s * scale * (1 - e.k * 0.3);
      c.fillStyle = rgba(shiftHue(col, i * 40), a);
      c.strokeStyle = rgba(WHITE, a * 0.9);
      c.lineWidth = 1.5 * scale;
      if (b.kind) star(c, x, y, size, size * 0.45, 5, b.rot + e.k * 3);
      else sparkle(c, x, y, size, b.rot + e.k * 3);
      c.fill();
      c.stroke();
    }
  },
};

export const stripeWipe: ClickEffect = {
  id: 'stripe-wipe',
  name: 'Stripe Wipe',
  family: 'chaos',
  blurb: 'Hard diagonal stripes sweep out from the click and snap away.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.45, k: 0 }),
  draw({ c, col, col2, scale }, e) {
    const r = lerp(6, 68, easeOutExpo(e.k)) * scale;
    const a = 1 - e.k;
    c.save();
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    c.clip();
    c.translate(e.x, e.y);
    c.rotate(-Math.PI / 4);
    const band = 9 * scale;
    for (let i = -8; i < 8; i++) {
      c.fillStyle = rgba(i % 2 ? col : col2, a * 0.85);
      c.fillRect(i * band * 2, -r * 1.5, band, r * 3);
    }
    c.restore();
  },
};

export const chromaSplit: ClickEffect = {
  id: 'chroma-split',
  name: 'Chroma Split',
  family: 'chaos',
  blurb: 'Three colour channels blast apart and snap back into register.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.4, k: 0 }),
  draw({ c, col, scale }, e) {
    // Out fast, back slower: separation peaks early then resolves.
    const sep = Math.sin(Math.min(e.k * 1.6, 1) * Math.PI) * 26 * scale;
    const r = lerp(10, 34, e.k) * scale;
    const a = (1 - e.k) * 0.55;
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * TAU;
      c.fillStyle = rgba(shiftHue(col, i * 120), a);
      c.beginPath();
      c.arc(e.x + Math.cos(ang) * sep, e.y + Math.sin(ang) * sep, r, 0, TAU);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  },
};

export const tapeSlap: ClickEffect = {
  id: 'tape-slap',
  name: 'Tape Slap',
  family: 'chaos',
  blurb: 'A strip of tape slaps down across the click point at a careless angle.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.6, k: 0, tilt: (ctx.rnd() - 0.5) * 0.7 }),
  draw({ c, col, scale }, e) {
    const grow = easeOutExpo(Math.min(e.k * 2.2, 1));
    const w = 84 * scale * grow;
    const h = 22 * scale;
    const a = 1 - Math.pow(e.k, 3);
    c.save();
    c.translate(e.x, e.y);
    c.rotate(e.tilt as number);
    c.fillStyle = rgba(INK, a);
    c.fillRect(-w / 2 + 5 * scale, -h / 2 + 5 * scale, w, h);
    c.fillStyle = rgba(col, a);
    c.fillRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = rgba(INK, a);
    c.lineWidth = 3 * scale;
    c.lineJoin = 'miter';
    c.strokeRect(-w / 2, -h / 2, w, h);
    c.lineJoin = 'round';
    c.restore();
  },
};

export const chaosEffects = [
  prismBurst,
  sunburst,
  hardStamp,
  noiseBlast,
  stickerPop,
  stripeWipe,
  chromaSplit,
  tapeSlap,
];
