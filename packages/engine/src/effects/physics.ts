import { TAU, clamp, easeOutCubic, easeOutQuint, lerp, rgba } from '@ck/math';
import type { ClickEffect, EffectInstance } from '../core/types';

/**
 * Physics family — effects that imply a force field rather than a shape.
 *
 * These all draw a population of markers whose *paths* carry the meaning:
 * spiralling in for a vortex, snapping inward for a magnet. The individual
 * marker is deliberately plain so the motion reads clearly.
 */

interface Field extends EffectInstance {
  ps: Array<{ a: number; d: number; s: number; w: number }>;
}

const field = (
  ctx: { rnd: () => number },
  n: number,
  spread: [number, number],
): Field['ps'] =>
  Array.from({ length: n }, (_, i) => ({
    a: (i / n) * TAU + (ctx.rnd() - 0.5) * 0.4,
    d: lerp(spread[0], spread[1], ctx.rnd()),
    s: 1 + ctx.rnd() * 2.2,
    w: 0.6 + ctx.rnd() * 0.8,
  }));

export const vortex: ClickEffect<Field> = {
  id: 'vortex',
  name: 'Vortex',
  family: 'physics',
  blurb: 'A brief swirl that drags everything inward along curved paths.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.85, k: 0, ps: field(ctx, 22, [30, 78]) }),
  draw({ c, col, col2, scale }, e) {
    const pull = easeOutCubic(e.k);
    for (const q of e.ps) {
      // Angle advances as radius shrinks — that coupling is what makes it a
      // spiral rather than a collapse.
      const d = q.d * (1 - pull) * scale;
      const a = q.a + pull * 3.6 * q.w;
      const x = e.x + Math.cos(a) * d;
      const y = e.y + Math.sin(a) * d;
      // A short arc of the path behind each particle, for motion blur.
      const a0 = a - 0.5 * q.w;
      c.strokeStyle = rgba(q.w > 1 ? col2 : col, (1 - e.k) * 0.8);
      c.lineWidth = q.s * scale * (1 - e.k * 0.5);
      c.beginPath();
      c.arc(e.x, e.y, d, a0, a);
      c.stroke();
      c.fillStyle = rgba(col, (1 - e.k) * 0.9);
      c.beginPath();
      c.arc(x, y, q.s * 0.6 * scale, 0, TAU);
      c.fill();
    }
  },
};

export const magneticSnap: ClickEffect<Field> = {
  id: 'magnetic-snap',
  name: 'Magnetic Snap',
  family: 'physics',
  blurb: 'Filings drawn in hard, held at the centre, then released.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.6, k: 0, ps: field(ctx, 18, [40, 88]) }),
  draw({ c, col, scale }, e) {
    // Snap in over the first 45%, hold, then scatter — three-beat timing.
    const inK = clamp(e.k / 0.45, 0, 1);
    const outK = clamp((e.k - 0.62) / 0.38, 0, 1);
    for (const q of e.ps) {
      const d = q.d * scale * (1 - easeOutQuint(inK) * 0.88 + outK * outK * 1.6);
      const dx = Math.cos(q.a);
      const dy = Math.sin(q.a);
      c.strokeStyle = rgba(col, (1 - e.k) * 0.85);
      c.lineWidth = q.s * 0.8 * scale;
      c.beginPath();
      c.moveTo(e.x + dx * d, e.y + dy * d);
      c.lineTo(e.x + dx * (d + 7 * scale * q.w), e.y + dy * (d + 7 * scale * q.w));
      c.stroke();
    }
    c.fillStyle = rgba(col, Math.sin(e.k * Math.PI) * 0.7);
    c.beginPath();
    c.arc(e.x, e.y, 5 * scale, 0, TAU);
    c.fill();
  },
};

export const gravityPull: ClickEffect<Field> = {
  id: 'gravity-pull',
  name: 'Gravity Well',
  family: 'physics',
  blurb: 'Rings bending toward a centre of mass, deepest at the moment of impact.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.9, k: 0, ps: field(ctx, 5, [22, 76]) }),
  draw({ c, col, col2, scale }, e) {
    const depth = Math.sin(Math.min(e.k * 1.6, 1) * Math.PI);
    for (let i = 0; i < e.ps.length; i++) {
      const q = e.ps[i];
      const r = q.d * scale;
      c.strokeStyle = rgba(i % 2 ? col2 : col, (1 - e.k) * 0.55);
      c.lineWidth = 1.3 * scale;
      c.beginPath();
      for (let j = 0; j <= 44; j++) {
        const a = (j / 44) * TAU;
        // Radius contracts most for the inner rings: a lensing falloff.
        const bend = 1 - (depth * 0.55) / (1 + (r / (30 * scale)) * (r / (30 * scale)));
        const px = e.x + Math.cos(a) * r * bend;
        const py = e.y + Math.sin(a) * r * bend;
        if (j === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.stroke();
    }
  },
};

export const explodeBounce: ClickEffect<Field> = {
  id: 'explode-bounce',
  name: 'Push & Return',
  family: 'physics',
  blurb: 'Markers shoved outward that overshoot, stall, and come back home.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.75, k: 0, ps: field(ctx, 16, [46, 82]) }),
  draw({ c, col, scale }, e) {
    // One sine hump: out and back in a single continuous motion.
    const push = Math.sin(e.k * Math.PI);
    for (const q of e.ps) {
      const d = q.d * scale * push;
      c.fillStyle = rgba(col, (1 - Math.pow(e.k, 3)) * 0.85);
      c.beginPath();
      c.arc(e.x + Math.cos(q.a) * d, e.y + Math.sin(q.a) * d, q.s * scale, 0, TAU);
      c.fill();
    }
  },
};

export const physicsEffects = [vortex, magneticSnap, gravityPull, explodeBounce];

export type { EffectInstance };
