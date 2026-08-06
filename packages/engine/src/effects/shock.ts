import { TAU, easeOutExpo, easeOutQuint, lerp, rgba } from '@ck/math';
import type { ClickEffect, EffectInstance } from '../core/types';

/**
 * Shockwave family — force, not decoration.
 *
 * These read as impact because they front-load everything: the radius covers
 * most of its distance in the first fifth of the animation, and the stroke
 * thins as it goes, so the energy visibly dissipates.
 */

export const shockwave: ClickEffect = {
  id: 'shockwave',
  name: 'Shockwave',
  family: 'shock',
  blurb: 'A hard ring that leaps outward and thins as the energy runs out.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.5, k: 0 }),
  draw({ c, col, scale }, e) {
    const r = lerp(2, 88, easeOutExpo(e.k)) * scale;
    c.strokeStyle = rgba(col, Math.pow(1 - e.k, 1.8) * 0.9);
    c.lineWidth = lerp(6, 0.5, easeOutQuint(e.k)) * scale;
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    c.stroke();
  },
};

export const shockwaveFill: ClickEffect = {
  id: 'shockwave-fill',
  name: 'Shockwave Fill',
  family: 'shock',
  blurb: 'A pressure front with a soft filled wake trailing behind it.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.62, k: 0 }),
  draw({ c, col, col2, scale }, e) {
    const r = lerp(2, 80, easeOutExpo(e.k)) * scale;
    const g = c.createRadialGradient(e.x, e.y, r * 0.55, e.x, e.y, r);
    g.addColorStop(0, rgba(col2, 0));
    g.addColorStop(0.8, rgba(col2, (1 - e.k) * 0.22));
    g.addColorStop(1, rgba(col, (1 - e.k) * 0.55));
    c.fillStyle = g;
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    c.fill();

    c.strokeStyle = rgba(col, Math.pow(1 - e.k, 2) * 0.95);
    c.lineWidth = lerp(4, 0.4, e.k) * scale;
    c.stroke();
  },
};

export const blastRing: ClickEffect = {
  id: 'blast-ring',
  name: 'Blast Ring',
  family: 'shock',
  blurb: 'A heavy band that expands and squashes flat, like a wave seen edge-on.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.55, k: 0 }),
  draw({ c, col, scale }, e) {
    const r = lerp(4, 76, easeOutExpo(e.k)) * scale;
    c.save();
    c.translate(e.x, e.y);
    // Vertical squash grows with radius — a ring in perspective, not a circle.
    c.scale(1, lerp(1, 0.62, easeOutQuint(e.k)));
    c.strokeStyle = rgba(col, Math.pow(1 - e.k, 1.5) * 0.85);
    c.lineWidth = lerp(9, 0.6, easeOutQuint(e.k)) * scale;
    c.beginPath();
    c.arc(0, 0, r, 0, TAU);
    c.stroke();
    c.restore();
  },
};

export const pressureWave: ClickEffect = {
  id: 'pressure-wave',
  name: 'Pressure Wave',
  family: 'shock',
  blurb: 'Two fronts a half-beat apart, the trailing one catching the leader.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.75, k: 0 }),
  draw({ c, col, col2, scale }, e) {
    for (let i = 0; i < 2; i++) {
      const k = (e.k - i * 0.12) / (1 - i * 0.12);
      if (k <= 0) continue;
      // Second front travels faster, so the gap closes rather than widening.
      const reach = i === 0 ? 78 : 70;
      const r = lerp(3, reach, easeOutExpo(k) * (i ? 1.1 : 1)) * scale;
      c.strokeStyle = rgba(i ? col2 : col, Math.pow(1 - k, 2) * (i ? 0.5 : 0.9));
      c.lineWidth = lerp(i ? 3 : 5, 0.4, k) * scale;
      c.beginPath();
      c.arc(e.x, e.y, r, 0, TAU);
      c.stroke();
    }
  },
};

export const implode: ClickEffect = {
  id: 'implode',
  name: 'Implode',
  family: 'shock',
  blurb: 'Runs the other way — a ring collapsing inward and snapping shut.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.48, k: 0 }),
  draw({ c, col, scale }, e) {
    const r = lerp(64, 0, easeOutQuint(e.k)) * scale;
    c.strokeStyle = rgba(col, Math.min(e.k * 3, 1) * 0.9);
    c.lineWidth = lerp(1, 3.4, e.k) * scale;
    c.beginPath();
    c.arc(e.x, e.y, Math.max(r, 0.5), 0, TAU);
    c.stroke();

    // The flash at the moment of collapse.
    if (e.k > 0.78) {
      const f = (e.k - 0.78) / 0.22;
      c.fillStyle = rgba(col, (1 - f) * 0.8);
      c.beginPath();
      c.arc(e.x, e.y, 10 * scale * f, 0, TAU);
      c.fill();
    }
  },
};

export const shockEffects = [shockwave, shockwaveFill, blastRing, pressureWave, implode];

export type { EffectInstance };
