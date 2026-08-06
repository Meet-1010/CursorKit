import { TAU, clamp, easeOutCubic, easeOutQuint, lerp, mixRGB, rgba } from '@ck/math';
import type { ClickEffect, EffectInstance } from '../core/types';

/**
 * Portal family — a hole in the page rather than a mark on it.
 *
 * The trick that sells depth is a dark core: an opening reads as an opening
 * only if the middle is *darker* than the surround. Every effect here paints
 * near-black at the centre and puts the colour in the rim.
 */

const VOID_COLOUR = { r: 6, g: 7, b: 11 };

interface Ring extends EffectInstance {
  spin: number;
}

export const portalOpen: ClickEffect<Ring> = {
  id: 'portal-open',
  name: 'Portal',
  family: 'portal',
  blurb: 'An aperture that irises open, holds, and shuts again.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.95, k: 0, spin: ctx.rnd() * TAU }),
  draw({ c, col, col2, scale }, e) {
    // Open fast, close slower — an aperture, not a pulse.
    const open = e.k < 0.35 ? easeOutQuint(e.k / 0.35) : 1 - easeOutCubic((e.k - 0.35) / 0.65);
    const r = 40 * scale * open;
    if (r < 0.5) return;

    const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
    g.addColorStop(0, rgba(VOID_COLOUR, 0.9));
    g.addColorStop(0.62, rgba(mixRGB(VOID_COLOUR, col, 0.35), 0.75));
    g.addColorStop(1, rgba(col, 0.15));
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(e.x, e.y, r, r * 1.18, e.spin * 0.2, 0, TAU);
    c.fill();

    c.strokeStyle = rgba(col2, open * 0.95);
    c.lineWidth = lerp(1, 3, open) * scale;
    c.stroke();

    // Rim arcs turning in the opposite direction give it a sense of mechanism.
    c.strokeStyle = rgba(col, open * 0.55);
    c.lineWidth = 1.2 * scale;
    for (let i = 0; i < 3; i++) {
      const a0 = e.spin * -1.6 + (i / 3) * TAU;
      c.beginPath();
      c.ellipse(e.x, e.y, r * 1.12, r * 1.3, e.spin * 0.2, a0, a0 + 0.7);
      c.stroke();
    }
  },
};

export const blackHole: ClickEffect<Ring> = {
  id: 'black-hole',
  name: 'Black Hole',
  family: 'portal',
  blurb: 'A dark core with a bright accretion rim and light bending around it.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 1.1, k: 0, spin: ctx.rnd() * TAU }),
  draw({ c, col, col2, scale }, e) {
    const grow = Math.sin(Math.min(e.k * 1.35, 1) * Math.PI);
    const r = 30 * scale * grow;
    if (r < 0.5) return;

    // Lensing halo: bright, thin, and wider than the core.
    const halo = c.createRadialGradient(e.x, e.y, r * 0.92, e.x, e.y, r * 1.75);
    halo.addColorStop(0, rgba(col2, 0.7 * grow));
    halo.addColorStop(0.3, rgba(col, 0.28 * grow));
    halo.addColorStop(1, rgba(col, 0));
    c.fillStyle = halo;
    c.beginPath();
    c.arc(e.x, e.y, r * 1.75, 0, TAU);
    c.fill();

    c.fillStyle = rgba(VOID_COLOUR, 0.95 * grow);
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    c.fill();

    // Accretion disc, foreshortened and rotating.
    c.save();
    c.translate(e.x, e.y);
    c.rotate(e.spin + e.k * 1.4);
    c.scale(1, 0.3);
    c.strokeStyle = rgba(col2, 0.9 * grow);
    c.lineWidth = 2.4 * scale;
    c.beginPath();
    c.arc(0, 0, r * 1.35, 0, TAU);
    c.stroke();
    c.restore();
  },
};

export const rippleDimension: ClickEffect<Ring> = {
  id: 'ripple-dimension',
  name: 'Rift',
  family: 'portal',
  blurb: 'A tear that opens along one axis then seals shut from both ends.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.75, k: 0, spin: ctx.rnd() * Math.PI }),
  draw({ c, col, col2, scale }, e) {
    const open = Math.sin(Math.min(e.k * 1.2, 1) * Math.PI);
    const len = 62 * scale * easeOutQuint(Math.min(e.k * 2, 1));
    const wide = 13 * scale * open;

    c.save();
    c.translate(e.x, e.y);
    c.rotate(e.spin);

    // Lens shape: two arcs meeting at sharp points, so the ends look torn.
    c.beginPath();
    c.moveTo(-len, 0);
    c.quadraticCurveTo(0, -wide, len, 0);
    c.quadraticCurveTo(0, wide, -len, 0);
    c.closePath();

    const g = c.createLinearGradient(-len, 0, len, 0);
    g.addColorStop(0, rgba(col, 0));
    g.addColorStop(0.5, rgba(VOID_COLOUR, 0.85 * open));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.fill();

    c.strokeStyle = rgba(col2, open * 0.95);
    c.lineWidth = 1.5 * scale;
    c.stroke();
    c.restore();
  },
};

export const timeWarp: ClickEffect<Ring> = {
  id: 'time-warp',
  name: 'Time Warp',
  family: 'portal',
  blurb: 'A spiral unwinding outward with clock ticks flaring as they pass.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 1, k: 0, spin: ctx.rnd() * TAU }),
  draw({ c, col, col2, scale }, e) {
    const grow = easeOutCubic(e.k);
    const maxR = 46 * scale * grow;
    const fade = 1 - Math.pow(e.k, 2);

    c.strokeStyle = rgba(col, fade * 0.8);
    c.lineWidth = 1.5 * scale;
    c.beginPath();
    const turns = 2.4;
    for (let i = 0; i <= 90; i++) {
      const t = i / 90;
      const a = e.spin + t * TAU * turns;
      const r = maxR * t;
      const px = e.x + Math.cos(a) * r;
      const py = e.y + Math.sin(a) * r;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.stroke();

    // Twelve ticks, each flaring as the spiral's leading edge sweeps past it.
    c.strokeStyle = rgba(col2, fade * 0.7);
    c.lineWidth = 1.2 * scale;
    c.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = e.spin + (i / 12) * TAU;
      const near = clamp(1 - Math.abs(((i / 12) % 1) - e.k) * 4, 0, 1);
      const l = (5 + near * 5) * scale;
      c.moveTo(e.x + Math.cos(a) * (maxR - l), e.y + Math.sin(a) * (maxR - l));
      c.lineTo(e.x + Math.cos(a) * maxR, e.y + Math.sin(a) * maxR);
    }
    c.stroke();
  },
};

export const portalEffects = [portalOpen, blackHole, rippleDimension, timeWarp];

export type { EffectInstance };
