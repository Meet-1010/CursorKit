import { TAU, easeOutCubic, easeOutQuint, lerp, rgba } from '@ck/math';
import type { ClickEffect, EffectInstance } from '../core/types';

/**
 * Ripple family — expanding rings.
 *
 * The shared discipline: radius eases *out* hard while opacity falls off
 * faster than linear. A ring that expands linearly and fades linearly looks
 * like a loading spinner; one that leaps and then decelerates looks like
 * something was struck.
 */

export const rippleClean: ClickEffect = {
  id: 'ripple-clean',
  name: 'Ripple',
  family: 'ripple',
  blurb: 'One ring, out fast and gone. The default for a reason.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.62, k: 0 }),
  draw({ c, col, scale }, e) {
    const r = lerp(4, 62, easeOutQuint(e.k)) * scale;
    c.strokeStyle = rgba(col, (1 - e.k) * (1 - e.k) * 0.85);
    c.lineWidth = lerp(2.6, 0.4, e.k) * scale;
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    c.stroke();
  },
};

export const rippleDouble: ClickEffect = {
  id: 'ripple-double',
  name: 'Double Ripple',
  family: 'ripple',
  blurb: 'Two rings on a short delay, the second chasing the first.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.8, k: 0 }),
  draw({ c, col, col2, scale }, e) {
    for (let i = 0; i < 2; i++) {
      // Offsetting progress rather than spawning twice keeps the pair welded
      // together — they always share a centre and a lifetime.
      const k = (e.k - i * 0.16) / (1 - i * 0.16);
      if (k <= 0) continue;
      const r = lerp(4, 58 - i * 10, easeOutQuint(k)) * scale;
      c.strokeStyle = rgba(i ? col2 : col, (1 - k) * (1 - k) * 0.8);
      c.lineWidth = lerp(2.4, 0.4, k) * scale;
      c.beginPath();
      c.arc(e.x, e.y, r, 0, TAU);
      c.stroke();
    }
  },
};

export const rippleTriple: ClickEffect = {
  id: 'ripple-triple',
  name: 'Triple Ripple',
  family: 'ripple',
  blurb: 'Three rings staggered just enough to read as one gesture.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 1, k: 0 }),
  draw({ c, col, col2, scale }, e) {
    for (let i = 0; i < 3; i++) {
      const k = (e.k - i * 0.13) / (1 - i * 0.13);
      if (k <= 0) continue;
      const r = lerp(3, 54 - i * 9, easeOutQuint(k)) * scale;
      c.strokeStyle = rgba(i === 1 ? col2 : col, Math.pow(1 - k, 2.2) * 0.75);
      c.lineWidth = lerp(2.2, 0.35, k) * scale;
      c.beginPath();
      c.arc(e.x, e.y, r, 0, TAU);
      c.stroke();
    }
  },
};

export const rippleFill: ClickEffect = {
  id: 'ripple-fill',
  name: 'Fill Ripple',
  family: 'ripple',
  blurb: 'A disc that floods outward, then drains from the centre.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.7, k: 0 }),
  draw({ c, col, scale }, e) {
    const r = lerp(2, 56, easeOutCubic(e.k)) * scale;
    // Inner edge chases the outer one, so the solid disc becomes an annulus
    // and then a thread before it goes.
    const inner = lerp(0, 52, easeOutCubic(Math.max(0, e.k - 0.22) / 0.78)) * scale;
    c.fillStyle = rgba(col, (1 - e.k) * 0.4);
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    if (inner > 0.5) c.arc(e.x, e.y, inner, 0, TAU, true);
    c.fill('evenodd');
  },
};

export const sonarPing: ClickEffect = {
  id: 'sonar-ping',
  name: 'Sonar',
  family: 'ripple',
  blurb: 'Slow concentric rings on a long decay, like a return from far off.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 1.5, k: 0 }),
  draw({ c, col, scale }, e) {
    for (let i = 0; i < 3; i++) {
      const k = (e.k - i * 0.2) / (1 - i * 0.2);
      if (k <= 0) continue;
      const r = lerp(6, 90, k) * scale;
      c.strokeStyle = rgba(col, Math.pow(1 - k, 3) * 0.55);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(e.x, e.y, r, 0, TAU);
      c.stroke();
    }
    c.fillStyle = rgba(col, Math.pow(1 - e.k, 4) * 0.8);
    c.beginPath();
    c.arc(e.x, e.y, 3 * scale, 0, TAU);
    c.fill();
  },
};

export const waterSplash: ClickEffect = {
  id: 'water-splash',
  name: 'Splash',
  family: 'ripple',
  blurb: 'An asymmetric ring that wobbles as it spreads — never a perfect circle.',
  spawn: (ctx, x, y) => ({
    x,
    y,
    age: 0,
    life: 0.85,
    k: 0,
    // Fixed per-instance harmonics: the wobble is decided at spawn so the ring
    // deforms coherently instead of shimmering.
    a: ctx.rnd() * TAU,
    m: 3 + Math.floor(ctx.rnd() * 3),
    d: 0.1 + ctx.rnd() * 0.12,
  }),
  draw({ c, col, scale }, e) {
    const base = lerp(4, 58, easeOutQuint(e.k)) * scale;
    const wob = (e.d as number) * (1 - e.k);
    c.strokeStyle = rgba(col, Math.pow(1 - e.k, 2) * 0.85);
    c.lineWidth = lerp(2.4, 0.4, e.k) * scale;
    c.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * TAU;
      const r = base * (1 + Math.sin(a * (e.m as number) + (e.a as number)) * wob);
      const px = e.x + Math.cos(a) * r;
      const py = e.y + Math.sin(a) * r;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.stroke();
  },
};

export const rippleEffects = [
  rippleClean,
  rippleDouble,
  rippleTriple,
  rippleFill,
  sonarPing,
  waterSplash,
];

export type { EffectInstance };
