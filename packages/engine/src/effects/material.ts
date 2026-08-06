import {
  TAU,
  easeOutCubic,
  easeOutExpo,
  easeOutQuint,
  lerp,
  mixRGB,
  rgba,
  roundRect,
} from '@ck/math';
import type { ClickEffect, EffectInstance } from '../core/types';

/**
 * Material family — click feedback that behaves like a substance.
 *
 * The rest of the effect library draws marks that appear and fade. These behave
 * like something was physically displaced: glass flexes and springs back, metal
 * rings, soft surfaces deform and recover. They are built to pair with the
 * skeuomorphic, neumorphic, glass and liquid-glass style categories, where a
 * flat expanding ring would look like it belonged to a different product.
 */

const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };

export const glassTap: ClickEffect = {
  id: 'glass-tap',
  name: 'Glass Tap',
  family: 'material',
  blurb: 'A rim highlight races around a ring, the way light runs along an edge.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.6, k: 0 }),
  draw({ c, col, scale }, e) {
    const r = lerp(8, 46, easeOutQuint(e.k)) * scale;
    const a = 1 - e.k;
    // Highlight travels around the circumference rather than fading in place.
    const head = e.k * TAU * 1.4 - 1;
    const g = c.createConicGradient?.(head, e.x, e.y);
    if (g) {
      g.addColorStop(0, rgba(WHITE, 0.9 * a));
      g.addColorStop(0.18, rgba(col, 0.35 * a));
      g.addColorStop(1, rgba(col, 0.05 * a));
      c.strokeStyle = g;
    } else {
      c.strokeStyle = rgba(WHITE, 0.7 * a);
    }
    c.lineWidth = 2.4 * scale * (1 - e.k * 0.6);
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    c.stroke();
  },
};

export const lensPop: ClickEffect = {
  id: 'lens-pop',
  name: 'Lens Pop',
  family: 'material',
  blurb: 'A lens bulges outward and springs flat, bending its own rim as it goes.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.55, k: 0 }),
  draw({ c, col, scale }, e) {
    // Overshoot then settle — the shape of something elastic being released.
    const bulge = Math.sin(e.k * Math.PI) * (1 - e.k * 0.3);
    const r = (18 + bulge * 22) * scale;
    const a = 1 - e.k * e.k;

    const g = c.createRadialGradient(e.x, e.y, r * 0.3, e.x, e.y, r);
    g.addColorStop(0, rgba(col, 0));
    g.addColorStop(0.72, rgba(col, 0.14 * a));
    g.addColorStop(0.94, rgba(WHITE, 0.4 * a));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    c.fill();
  },
};

export const softPress: ClickEffect = {
  id: 'soft-press',
  name: 'Soft Press',
  family: 'material',
  blurb: 'A neumorphic dent that appears in the surface and slowly fills back in.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.7, k: 0 }),
  draw({ c, col, scale }, e) {
    const r = lerp(6, 34, easeOutCubic(Math.min(e.k * 2.4, 1))) * scale;
    const a = Math.pow(1 - e.k, 1.5);
    // The two offset shadows are the entire neumorphic vocabulary — inverted
    // here, so the mark reads as pressed in rather than raised.
    const off = 4 * scale;
    c.save();
    c.shadowColor = rgba(mixRGB(col, BLACK, 0.5), 0.5 * a);
    c.shadowBlur = 8 * scale;
    c.shadowOffsetX = -off;
    c.shadowOffsetY = -off;
    c.strokeStyle = rgba(col, 0.001);
    c.lineWidth = 6 * scale;
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    c.stroke();
    c.shadowColor = rgba(WHITE, 0.6 * a);
    c.shadowOffsetX = off;
    c.shadowOffsetY = off;
    c.stroke();
    c.restore();
  },
};

export const metalRing: ClickEffect = {
  id: 'metal-ring',
  name: 'Metal Ring',
  family: 'material',
  blurb: 'Three rings ringing out at decaying intervals, like a struck bell.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 1.1, k: 0 }),
  draw({ c, col, col2, scale }, e) {
    for (let i = 0; i < 3; i++) {
      // Delays shrink geometrically, which is what a decaying resonance does.
      const delay = (1 - Math.pow(0.55, i)) * 0.5;
      const k = (e.k - delay) / (1 - delay);
      if (k <= 0) continue;
      const r = lerp(5, 52 - i * 8, easeOutExpo(k)) * scale;
      const g = c.createLinearGradient(e.x - r, e.y - r, e.x + r, e.y + r);
      const hot = mixRGB(col2, WHITE, 0.5);
      g.addColorStop(0, rgba(col, 0));
      g.addColorStop(0.35, rgba(hot, Math.pow(1 - k, 2) * 0.85));
      g.addColorStop(0.65, rgba(col, Math.pow(1 - k, 2) * 0.5));
      g.addColorStop(1, rgba(col, 0));
      c.strokeStyle = g;
      c.lineWidth = (2.2 - i * 0.5) * scale;
      c.beginPath();
      c.arc(e.x, e.y, r, 0, TAU);
      c.stroke();
    }
  },
};

export const emboss: ClickEffect = {
  id: 'emboss',
  name: 'Emboss',
  family: 'material',
  blurb: 'A rounded square stamped into the page, lit like pressed card.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.65, k: 0 }),
  draw({ c, col, scale }, e) {
    const s = lerp(10, 44, easeOutQuint(e.k)) * scale;
    const a = Math.pow(1 - e.k, 2);
    const off = 2.5 * scale;
    const path = (dx: number, dy: number) =>
      roundRect(c, e.x - s / 2 + dx, e.y - s / 2 + dy, s, s, 8 * scale);

    c.strokeStyle = rgba(WHITE, 0.5 * a);
    c.lineWidth = 2 * scale;
    path(-off, -off);
    c.stroke();
    c.strokeStyle = rgba(mixRGB(col, BLACK, 0.5), 0.5 * a);
    path(off, off);
    c.stroke();
    c.strokeStyle = rgba(col, 0.7 * a);
    c.lineWidth = 1.2 * scale;
    path(0, 0);
    c.stroke();
  },
};

export const liquidSplit: ClickEffect = {
  id: 'liquid-split',
  name: 'Liquid Split',
  family: 'material',
  blurb: 'A bead of glass splits into two and merges back together.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.7, k: 0 }),
  draw({ c, col, scale }, e) {
    // Out and back on one sine hump, so the two halves rejoin.
    const sep = Math.sin(e.k * Math.PI) * 30 * scale;
    const r = (14 - Math.sin(e.k * Math.PI) * 4) * scale;
    const a = 1 - Math.pow(e.k, 3);
    for (const dir of [-1, 1]) {
      const x = e.x + dir * sep;
      const g = c.createRadialGradient(x - r * 0.3, e.y - r * 0.3, 0, x, e.y, r);
      g.addColorStop(0, rgba(WHITE, 0.6 * a));
      g.addColorStop(0.6, rgba(col, 0.3 * a));
      g.addColorStop(1, rgba(col, 0.06 * a));
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, e.y, r, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(WHITE, 0.5 * a);
      c.lineWidth = 1.2 * scale;
      c.stroke();
    }
  },
};

interface Shards extends EffectInstance {
  bits: Array<{ a: number; d: number; w: number; len: number }>;
}

export const glassShatter: ClickEffect<Shards> = {
  id: 'glass-shatter',
  name: 'Shatter',
  family: 'material',
  blurb: 'Angular glass shards fly outward, catching light on their long edges.',
  spawn: (ctx, x, y) => ({
    x, y, age: 0, life: 0.75, k: 0,
    bits: Array.from({ length: 13 }, (_, i) => ({
      a: (i / 13) * TAU + (ctx.rnd() - 0.5) * 0.5,
      d: 40 + ctx.rnd() * 60,
      w: 3 + ctx.rnd() * 6,
      len: 10 + ctx.rnd() * 18,
    })),
  }),
  draw({ c, col, scale }, e) {
    const push = easeOutQuint(e.k);
    const a = 1 - Math.pow(e.k, 2);
    for (const b of e.bits) {
      const d = b.d * push * scale;
      const x = e.x + Math.cos(b.a) * d;
      const y = e.y + Math.sin(b.a) * d;
      c.save();
      c.translate(x, y);
      c.rotate(b.a);
      // A long thin triangle reads as a shard; a rectangle reads as confetti.
      c.beginPath();
      c.moveTo(b.len * scale * (1 - e.k * 0.4), 0);
      c.lineTo(-b.len * scale * 0.3, -b.w * scale * 0.5);
      c.lineTo(-b.len * scale * 0.3, b.w * scale * 0.5);
      c.closePath();
      const g = c.createLinearGradient(-b.len * scale * 0.3, 0, b.len * scale, 0);
      g.addColorStop(0, rgba(col, 0.15 * a));
      g.addColorStop(0.7, rgba(WHITE, 0.55 * a));
      g.addColorStop(1, rgba(col, 0.1 * a));
      c.fillStyle = g;
      c.fill();
      c.restore();
    }
  },
};

export const materialEffects = [
  glassTap,
  lensPop,
  softPress,
  metalRing,
  emboss,
  liquidSplit,
  glassShatter,
];
