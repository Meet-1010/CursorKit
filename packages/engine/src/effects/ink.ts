import { TAU, closedSpline, easeOutCubic, easeOutQuint, mixRGB, noise1, rgba } from '@ck/math';
import type { ClickEffect, Ctx, EffectInstance } from '../core/types';

/**
 * Ink and paint family.
 *
 * The common technique is a noisy closed spline rather than a circle. Ink does
 * not spread evenly — it follows the grain of the paper — so every silhouette
 * here is irregular, fixed at spawn so the blot stays the same blot as it grows.
 */

interface Splat extends EffectInstance {
  seed: number;
  pts: number[];
  drops: Array<{ a: number; d: number; r: number }>;
}

function makeSplat(ctx: Ctx, x: number, y: number, life: number, drops: number): Splat {
  return {
    x,
    y,
    age: 0,
    life,
    k: 0,
    seed: ctx.rnd() * 100,
    pts: new Array(22 * 2).fill(0),
    drops: Array.from({ length: drops }, () => ({
      a: ctx.rnd() * TAU,
      d: 0.6 + ctx.rnd() * 0.9,
      r: 1.4 + ctx.rnd() * 3.4,
    })),
  };
}

/** Traces the blot outline at radius `r`, with `rough` controlling raggedness. */
function blot(c: CanvasRenderingContext2D, e: Splat, r: number, rough: number): void {
  const n = e.pts.length / 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const w =
      noise1(e.seed + i * 0.55) * rough + noise1(e.seed * 1.7 + i * 1.9) * rough * 0.5;
    const rr = r * (1 + w);
    e.pts[i * 2] = e.x + Math.cos(a) * rr;
    e.pts[i * 2 + 1] = e.y + Math.sin(a) * rr;
  }
  closedSpline(c, e.pts);
}

export const inkSplat: ClickEffect<Splat> = {
  id: 'ink-splat',
  name: 'Ink Splat',
  family: 'ink',
  blurb: 'A ragged blot that lands hard and throws satellite droplets.',
  spawn: (ctx, x, y) => makeSplat(ctx, x, y, 0.9, 7),
  draw({ c, col, scale }, e) {
    const grow = easeOutQuint(Math.min(e.k * 2.6, 1));
    const r = 26 * scale * grow;
    const fade = 1 - Math.pow(e.k, 2.4);

    c.fillStyle = rgba(col, fade * 0.9);
    blot(c, e, r, 0.24);
    c.fill();

    for (const d of e.drops) {
      const dd = r * d.d * (1 + grow * 0.7);
      c.beginPath();
      c.arc(e.x + Math.cos(d.a) * dd, e.y + Math.sin(d.a) * dd, d.r * scale * grow, 0, TAU);
      c.fill();
    }
  },
};

export const paintSplash: ClickEffect<Splat> = {
  id: 'paint-splash',
  name: 'Paint Splash',
  family: 'ink',
  blurb: 'Wet pigment with streaked flicks radiating from the point of impact.',
  spawn: (ctx, x, y) => makeSplat(ctx, x, y, 0.95, 10),
  draw({ c, col, col2, scale }, e) {
    const grow = easeOutCubic(Math.min(e.k * 2.2, 1));
    const r = 24 * scale * grow;
    const fade = 1 - Math.pow(e.k, 2.2);

    // Flicks first, so the body covers where they attach.
    c.lineCap = 'round';
    for (const d of e.drops) {
      const len = r * d.d * 1.9;
      c.strokeStyle = rgba(mixRGB(col, col2, d.d - 0.6), fade * 0.75);
      c.lineWidth = d.r * 0.55 * scale * grow;
      c.beginPath();
      c.moveTo(e.x + Math.cos(d.a) * r * 0.5, e.y + Math.sin(d.a) * r * 0.5);
      c.lineTo(e.x + Math.cos(d.a) * len, e.y + Math.sin(d.a) * len);
      c.stroke();
      c.fillStyle = rgba(col, fade * 0.8);
      c.beginPath();
      c.arc(e.x + Math.cos(d.a) * len, e.y + Math.sin(d.a) * len, d.r * 0.5 * scale * grow, 0, TAU);
      c.fill();
    }

    c.fillStyle = rgba(col, fade * 0.92);
    blot(c, e, r, 0.2);
    c.fill();
  },
};

export const watercolorBloom: ClickEffect<Splat> = {
  id: 'watercolor-bloom',
  name: 'Watercolour',
  family: 'ink',
  blurb: 'Pigment bleeding outward in layers, darkest where it pooled first.',
  spawn: (ctx, x, y) => makeSplat(ctx, x, y, 1.5, 0),
  draw({ c, col, col2, scale }, e) {
    const fade = 1 - Math.pow(e.k, 1.6);
    // Three washes at different rates: watercolour is layered, not a gradient.
    for (let i = 0; i < 3; i++) {
      const speed = 1 - i * 0.22;
      const r = 34 * scale * easeOutCubic(Math.min(e.k * 1.6 * speed, 1)) * (1 + i * 0.18);
      if (r < 0.5) continue;
      c.fillStyle = rgba(i === 1 ? col2 : col, fade * (0.16 - i * 0.03));
      blot(c, e, r, 0.16 + i * 0.05);
      c.fill();
    }
    c.fillStyle = rgba(col, fade * 0.3);
    blot(c, e, 12 * scale * easeOutCubic(Math.min(e.k * 2, 1)), 0.14);
    c.fill();
  },
};

export const brushBurst: ClickEffect<Splat> = {
  id: 'brush-burst',
  name: 'Brush Burst',
  family: 'ink',
  blurb: 'Tapered brush strokes radiating outward, each with a dry-bristle end.',
  spawn: (ctx, x, y) => makeSplat(ctx, x, y, 0.7, 9),
  draw({ c, col, col2, scale }, e) {
    const grow = easeOutQuint(Math.min(e.k * 2, 1));
    const fade = 1 - Math.pow(e.k, 2);

    for (const d of e.drops) {
      const len = 46 * scale * d.d * grow;
      const wide = d.r * 1.5 * scale;
      const dx = Math.cos(d.a);
      const dy = Math.sin(d.a);
      // A stroke drawn as a filled wedge, so it can actually taper.
      c.fillStyle = rgba(d.d > 1.1 ? col2 : col, fade * 0.85);
      c.beginPath();
      c.moveTo(e.x - dy * wide, e.y + dx * wide);
      c.quadraticCurveTo(
        e.x + dx * len * 0.6 - dy * wide * 0.4,
        e.y + dy * len * 0.6 + dx * wide * 0.4,
        e.x + dx * len,
        e.y + dy * len,
      );
      c.quadraticCurveTo(
        e.x + dx * len * 0.6 + dy * wide * 0.4,
        e.y + dy * len * 0.6 - dx * wide * 0.4,
        e.x + dy * wide,
        e.y - dx * wide,
      );
      c.closePath();
      c.fill();
    }

    c.fillStyle = rgba(col, fade * 0.9);
    c.beginPath();
    c.arc(e.x, e.y, 7 * scale * grow, 0, TAU);
    c.fill();
  },
};

export const inkEffects = [inkSplat, paintSplash, watercolorBloom, brushBurst];

export type { EffectInstance };
