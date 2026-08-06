import {
  TAU,
  clamp,
  damp,
  type Lag,
  follow,
  lerp,
  newLag,
  polyline,
  rgba,
} from '@ck/math';
import type { CursorStyle, Pointer } from '../core/types';

/**
 * Trail styles.
 *
 * All of these read the pointer's shared position history (`p.trail`, newest
 * first) rather than each keeping their own buffer. Sampling is interpolated so
 * a trail stays smooth even when the pointer outruns the frame rate.
 */

const tx = (p: Pointer, i: number): number => p.trail[Math.min(i, p.trailLen - 1) * 2];
const ty = (p: Pointer, i: number): number => p.trail[Math.min(i, p.trailLen - 1) * 2 + 1];

/** Fills `out` with an interpolated trail sample at fractional index `f`. */
function at(p: Pointer, f: number, out: { x: number; y: number }): void {
  const max = Math.max(p.trailLen - 1, 0);
  const k = clamp(f, 0, max);
  const a = Math.floor(k);
  const b = Math.min(a + 1, max);
  const m = k - a;
  out.x = lerp(tx(p, a), tx(p, b), m);
  out.y = lerp(ty(p, a), ty(p, b), m);
}

const pt = { x: 0, y: 0 };

export const springFollow: CursorStyle<{ a: Lag; b: Lag }> = {
  id: 'spring-follow',
  name: 'Spring Follow',
  category: 'trail',
  blurb: 'Three bodies on three different springs, arriving one after another.',
  state: () => ({ a: newLag(), b: newLag() }),
  draw({ c, p, col, col2, scale, dt }, s) {
    follow(s.a, p.x, p.y, 9, dt);
    follow(s.b, s.a.x, s.a.y, 6, dt);

    c.fillStyle = rgba(col2, 0.28);
    c.beginPath();
    c.arc(s.b.x, s.b.y, 13 * scale * (1 + p.hoverAmt * 0.6), 0, TAU);
    c.fill();

    c.strokeStyle = rgba(col, 0.7);
    c.lineWidth = 1.4 * scale;
    c.beginPath();
    c.arc(s.a.x, s.a.y, 9 * scale * (1 + p.hoverAmt * 0.7), 0, TAU);
    c.stroke();

    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 3.4 * scale * (1 - p.press * 0.25), 0, TAU);
    c.fill();
  },
};

export const elasticTail: CursorStyle<{ tail: Lag }> = {
  id: 'elastic-tail',
  name: 'Elastic Tail',
  category: 'trail',
  blurb: 'A band stretched between where you are and where you just were.',
  state: () => ({ tail: newLag() }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s.tail, p.x, p.y, 7, dt);
    const d = Math.hypot(p.x - s.tail.x, p.y - s.tail.y);
    const w = 5 * scale * clamp(1 - d / (160 * scale), 0.15, 1);

    if (d > 1) {
      c.strokeStyle = rgba(col, 0.6);
      c.lineWidth = w * 2;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(s.tail.x, s.tail.y);
      c.stroke();
    }

    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 6 * scale * (1 + p.hoverAmt * 0.6 - p.press * 0.2), 0, TAU);
    c.fill();
  },
};

export const dotChain: CursorStyle = {
  id: 'dot-chain',
  name: 'Dot Chain',
  category: 'trail',
  blurb: 'Eight beads strung out behind the pointer, each smaller than the last.',
  trail: 40,
  draw({ c, p, col, col2, scale }) {
    const n = 8;
    for (let i = n - 1; i >= 0; i--) {
      const k = i / (n - 1);
      at(p, i * 3.4, pt);
      const r = lerp(4.4, 1.1, k) * scale;
      c.fillStyle = rgba(i === 0 ? col : col2, lerp(1, 0.2, k));
      c.beginPath();
      c.arc(pt.x, pt.y, r, 0, TAU);
      c.fill();
    }
  },
};

export const ribbon: CursorStyle = {
  id: 'ribbon',
  name: 'Ribbon',
  category: 'trail',
  blurb: 'A tapered brush stroke that thins to nothing at its tail.',
  trail: 48,
  draw({ c, p, col, scale }) {
    const n = 22;
    if (p.trailLen < 4) return;
    // Drawn as stacked segments rather than one stroke, because a single
    // polyline cannot taper — and the taper is the whole shape.
    for (let i = n - 1; i > 0; i--) {
      const k = i / n;
      at(p, i * 1.7, pt);
      const ax = pt.x;
      const ay = pt.y;
      at(p, (i - 1) * 1.7, pt);
      c.strokeStyle = rgba(col, (1 - k) * 0.85);
      c.lineWidth = lerp(9, 0.5, k) * scale;
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(pt.x, pt.y);
      c.stroke();
    }
  },
};

export const snake: CursorStyle = {
  id: 'snake',
  name: 'Snake',
  category: 'trail',
  blurb: 'A continuous body with a head, following its own path exactly.',
  trail: 48,
  draw({ c, p, col, scale }) {
    if (p.trailLen < 4) return;
    const pts: number[] = [];
    for (let i = 0; i < 18; i++) {
      at(p, i * 1.6, pt);
      pts.push(pt.x, pt.y);
    }
    c.strokeStyle = rgba(col, 0.55);
    c.lineWidth = 5.5 * scale;
    polyline(c, pts);
    c.stroke();

    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 2.4 * scale;
    c.stroke();

    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 5 * scale * (1 + p.hoverAmt * 0.5), 0, TAU);
    c.fill();
  },
};

export const comet: CursorStyle<{ glow: number }> = {
  id: 'comet',
  name: 'Comet',
  category: 'trail',
  blurb: 'A bright head dragging a long tail that only appears at speed.',
  trail: 56,
  state: () => ({ glow: 0 }),
  draw({ c, p, col, col2, scale, dt, calm }, s) {
    s.glow = damp(s.glow, clamp(p.speed / 1400, 0, 1), 9, dt);
    const len = 26;

    if (!calm && s.glow > 0.02) {
      for (let i = len - 1; i > 0; i--) {
        const k = i / len;
        at(p, i * 1.5, pt);
        const ax = pt.x;
        const ay = pt.y;
        at(p, (i - 1) * 1.5, pt);
        c.strokeStyle = rgba(col2, (1 - k) * (1 - k) * 0.6 * s.glow);
        c.lineWidth = lerp(7, 0.4, k) * scale;
        c.beginPath();
        c.moveTo(ax, ay);
        c.lineTo(pt.x, pt.y);
        c.stroke();
      }
    }

    const r = 5.5 * scale * (1 + p.hoverAmt * 0.5);
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.4);
    g.addColorStop(0, rgba(col, 1));
    g.addColorStop(0.32, rgba(col, 0.5));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(p.x, p.y, r * 3.4, 0, TAU);
    c.fill();
  },
};

export const brushstroke: CursorStyle = {
  id: 'brushstroke',
  name: 'Brushstroke',
  category: 'trail',
  blurb: 'A loaded brush — wide where you moved slowly, thin where you rushed.',
  trail: 48,
  draw({ c, p, col, scale }) {
    if (p.trailLen < 6) return;
    const n = 24;
    for (let i = n - 1; i > 0; i--) {
      const k = i / n;
      at(p, i * 1.5, pt);
      const ax = pt.x;
      const ay = pt.y;
      at(p, (i - 1) * 1.5, pt);
      // Segment length stands in for speed: long gaps mean a fast, dry stroke.
      const seg = Math.hypot(pt.x - ax, pt.y - ay);
      const wet = clamp(1 - seg / 60, 0.25, 1);
      c.strokeStyle = rgba(col, (1 - k * 0.85) * 0.9);
      c.lineWidth = lerp(13, 2, k) * wet * scale;
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(pt.x, pt.y);
      c.stroke();
    }
  },
};

export const lightStreak: CursorStyle<{ amt: number }> = {
  id: 'light-streak',
  name: 'Light Streak',
  category: 'trail',
  blurb: 'A shutter-drag streak that stretches out of the dot as you accelerate.',
  state: () => ({ amt: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    s.amt = damp(s.amt, clamp(p.speed / 2200, 0, 1), 11, dt);
    const len = s.amt * 70 * scale;
    const r = 5 * scale * (1 + p.hoverAmt * 0.5);

    if (len > 2) {
      const bx = p.x - Math.cos(p.angle) * len;
      const by = p.y - Math.sin(p.angle) * len;
      const g = c.createLinearGradient(p.x, p.y, bx, by);
      g.addColorStop(0, rgba(col, 0.85));
      g.addColorStop(1, rgba(col2, 0));
      c.strokeStyle = g;
      c.lineWidth = r * 1.7;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(bx, by);
      c.stroke();
    }

    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, r, 0, TAU);
    c.fill();
  },
};

export const inkTrail: CursorStyle = {
  id: 'ink-trail',
  name: 'Ink Trail',
  category: 'trail',
  blurb: 'A wet line drying behind you, darkest where the nib pressed longest.',
  trail: 56,
  draw({ c, p, col, scale }) {
    if (p.trailLen < 6) return;
    const n = 28;
    c.lineCap = 'round';
    for (let i = n - 1; i > 0; i--) {
      const k = i / n;
      at(p, i * 1.8, pt);
      const ax = pt.x;
      const ay = pt.y;
      at(p, (i - 1) * 1.8, pt);
      // Ink pools at the slow parts: inverse of segment length.
      const seg = Math.hypot(pt.x - ax, pt.y - ay);
      const pool = clamp(1 - seg / 45, 0.3, 1);
      c.strokeStyle = rgba(col, Math.pow(1 - k, 1.6) * 0.75);
      c.lineWidth = lerp(7, 1, k) * pool * scale;
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(pt.x, pt.y);
      c.stroke();
    }
    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(p.x, p.y, 4 * scale, 0, TAU);
    c.fill();
  },
};

export const trailStyles = [
  springFollow,
  elasticTail,
  dotChain,
  ribbon,
  snake,
  comet,
  brushstroke,
  lightStreak,
  inkTrail,
];
