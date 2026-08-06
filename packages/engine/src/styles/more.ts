import {
  HALF_PI,
  TAU,
  clamp,
  damp,
  type Lag,
  follow,
  lerp,
  mixRGB,
  newLag,
  ngon,
  noise1,
  polyline,
  rgba,
  roundRect,
  shiftHue,
} from '@ck/math';
import type { CursorStyle, Pointer } from '../core/types';

/**
 * Second wave for the original eight categories.
 *
 * These live together rather than being folded back into the category files
 * because the split is by *when they were designed*, not by what they are — and
 * the category files were already long enough that appending forty more would
 * have made them hard to read. Category membership is carried on each
 * definition, so the gallery and the builder see no difference.
 */

const WHITE = { r: 255, g: 255, b: 255 };
const tx = (p: Pointer, i: number): number => p.trail[Math.min(i, p.trailLen - 1) * 2];
const ty = (p: Pointer, i: number): number => p.trail[Math.min(i, p.trailLen - 1) * 2 + 1];

/* ----------------------------------------------------------------- minimal */

export const dotOnly: CursorStyle = {
  id: 'dot-only',
  name: 'Just a Dot',
  category: 'minimal',
  blurb: 'One dot, sized well. The baseline every other style is measured against.',
  draw({ c, p, col, scale }) {
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 5 * scale * (1 + p.hoverAmt * 0.7 - p.press * 0.25), 0, TAU);
    c.fill();
  },
};

export const dotHalo: CursorStyle<Lag> = {
  id: 'dot-halo',
  name: 'Halo',
  category: 'minimal',
  blurb: 'A crisp dot inside a soft radial falloff. Reads on busy backgrounds.',
  state: newLag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 13, dt);
    const r = 24 * scale * (1 + p.hoverAmt * 0.5);
    const g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
    g.addColorStop(0, rgba(col, 0.22));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(s.x, s.y, r, 0, TAU);
    c.fill();
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 3.2 * scale, 0, TAU);
    c.fill();
  },
};

export const tickRing: CursorStyle<Lag & { spin: number }> = {
  id: 'tick-ring',
  name: 'Tick Ring',
  category: 'minimal',
  blurb: 'A ring of tick marks instead of a stroke, counting slowly round.',
  state: () => ({ ...newLag(), spin: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 14, dt);
    s.spin += dt * 0.5;
    const r = 16 * scale * (1 + p.hoverAmt * 0.5);
    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = 1.2 * scale;
    c.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = s.spin + (i / 24) * TAU;
      const len = i % 6 === 0 ? 5 : 2.5;
      c.moveTo(s.x + Math.cos(a) * (r - len * scale), s.y + Math.sin(a) * (r - len * scale));
      c.lineTo(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r);
    }
    c.stroke();
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 2.2 * scale, 0, TAU);
    c.fill();
  },
};

export const squareDot: CursorStyle<Lag> = {
  id: 'square-dot',
  name: 'Square Dot',
  category: 'minimal',
  blurb: 'A pixel-crisp square that rotates 45° when it finds something to click.',
  state: newLag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 19, dt);
    const r = 6 * scale * (1 + p.hoverAmt * 0.8 - p.press * 0.2);
    c.save();
    c.translate(s.x, s.y);
    c.rotate((Math.PI / 4) * p.hoverAmt);
    c.fillStyle = rgba(col, 0.97);
    c.fillRect(-r, -r, r * 2, r * 2);
    c.restore();
  },
};

export const arcPair: CursorStyle<Lag & { spin: number }> = {
  id: 'arc-pair',
  name: 'Arc Pair',
  category: 'minimal',
  blurb: 'Two opposing arcs that open apart as you approach something live.',
  state: () => ({ ...newLag(), spin: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 15, dt);
    s.spin += dt * 0.35;
    const r = 15 * scale;
    const gap = lerp(0.5, 1.15, p.hoverAmt);
    c.strokeStyle = rgba(col, 0.92);
    c.lineWidth = 2 * scale;
    for (const dir of [0, Math.PI]) {
      c.beginPath();
      c.arc(s.x, s.y, r, s.spin + dir + gap / 2, s.spin + dir + Math.PI - gap / 2);
      c.stroke();
    }
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 2 * scale, 0, TAU);
    c.fill();
  },
};

/* --------------------------------------------------------------- geometric */

export const chevronStack: CursorStyle = {
  id: 'chevron-stack',
  name: 'Chevrons',
  category: 'geometric',
  blurb: 'Three nested chevrons pointing the way you are travelling.',
  draw({ c, p, col, scale }) {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle);
    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 2 * scale;
    for (let i = 0; i < 3; i++) {
      const off = (i * 6 - 6) * scale;
      const h = (7 - i) * scale;
      c.globalAlpha = 1 - i * 0.28;
      c.beginPath();
      c.moveTo(off - 5 * scale, -h);
      c.lineTo(off, 0);
      c.lineTo(off - 5 * scale, h);
      c.stroke();
    }
    c.globalAlpha = 1;
    c.restore();
  },
};

export const triangleOutline: CursorStyle<Lag & { spin: number }> = {
  id: 'triangle-outline',
  name: 'Triangle Outline',
  category: 'geometric',
  blurb: 'A hollow triangle turning against a counter-rotating inner mark.',
  state: () => ({ ...newLag(), spin: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 15, dt);
    s.spin += dt * (0.4 + p.hoverAmt * 2);
    const r = 16 * scale * (1 + p.hoverAmt * 0.4);
    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 1.6 * scale;
    ngon(c, s.x, s.y, r, 3, s.spin - HALF_PI);
    c.stroke();
    c.fillStyle = rgba(col, 0.8);
    ngon(c, s.x, s.y, r * 0.3, 3, -s.spin * 2 - HALF_PI);
    c.fill();
  },
};

export const nestedSquares: CursorStyle<Lag & { spin: number }> = {
  id: 'nested-squares',
  name: 'Nested Squares',
  category: 'geometric',
  blurb: 'Three squares rotating at different rates inside one another.',
  state: () => ({ ...newLag(), spin: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 16, dt);
    s.spin += dt * 0.6;
    const base = 16 * scale * (1 + p.hoverAmt * 0.35);
    c.strokeStyle = rgba(col, 0.9);
    for (let i = 0; i < 3; i++) {
      const r = base * (1 - i * 0.28);
      c.save();
      c.translate(s.x, s.y);
      c.rotate(s.spin * (i % 2 ? -1.6 : 1));
      c.lineWidth = (1.8 - i * 0.4) * scale;
      c.strokeRect(-r, -r, r * 2, r * 2);
      c.restore();
    }
  },
};

export const barCross: CursorStyle = {
  id: 'bar-cross',
  name: 'Bar Cross',
  category: 'geometric',
  blurb: 'Two offset bars forming an off-centre cross. Deliberately asymmetric.',
  draw({ c, p, col, scale }) {
    const a = 15 * scale * (1 + p.hoverAmt * 0.4);
    const w = 2.6 * scale;
    c.fillStyle = rgba(col, 0.95);
    c.fillRect(p.x - a, p.y - w / 2 - 3 * scale, a * 2, w);
    c.fillRect(p.x - w / 2 + 4 * scale, p.y - a, w, a * 2);
  },
};

export const pentagram: CursorStyle<Lag & { spin: number }> = {
  id: 'pentagon-lock',
  name: 'Pentagon Lock',
  category: 'geometric',
  blurb: 'A pentagon with a lock indicator that closes over interactive elements.',
  state: () => ({ ...newLag(), spin: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    follow(s, p.x, p.y, 16, dt);
    s.spin += dt * 0.3;
    const r = 15 * scale;
    c.strokeStyle = rgba(col, 0.92);
    c.lineWidth = 1.6 * scale;
    ngon(c, s.x, s.y, r, 5, s.spin - HALF_PI);
    c.stroke();
    if (p.hoverAmt > 0.02) {
      c.fillStyle = rgba(col2, p.hoverAmt * 0.85);
      ngon(c, s.x, s.y, r * 0.45 * p.hoverAmt, 5, -s.spin - HALF_PI);
      c.fill();
    }
  },
};

/* ------------------------------------------------------------------- fluid */

export const jelly: CursorStyle<Lag & { vx: number; vy: number }> = {
  id: 'jelly',
  name: 'Jelly',
  category: 'fluid',
  blurb: 'A wobbling mass with real spring physics — it overshoots and settles.',
  state: () => ({ ...newLag(), vx: 0, vy: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    // A proper spring rather than exponential smoothing, so it can overshoot.
    if (!s.init) {
      s.x = p.x;
      s.y = p.y;
      s.init = true;
    }
    const k = 260;
    const damping = 14;
    s.vx += (p.x - s.x) * k * dt - s.vx * damping * dt;
    s.vy += (p.y - s.y) * k * dt - s.vy * damping * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    const sp = Math.hypot(s.vx, s.vy);
    const stretch = 1 + Math.min(sp / 2600, 0.7);
    const r = 15 * scale * (1 + p.hoverAmt * 0.35 - p.press * 0.2);
    c.save();
    c.translate(s.x, s.y);
    c.rotate(Math.atan2(s.vy, s.vx));
    c.scale(stretch, 1 / stretch);
    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(0, 0, r, 0, TAU);
    c.fill();
    c.restore();
  },
};

export const lavaLamp: CursorStyle<Lag & { blobs: Array<{ a: number; d: number; r: number; sp: number }> }> = {
  id: 'lava-lamp',
  name: 'Lava Lamp',
  category: 'fluid',
  blurb: 'Slow globules orbiting and merging around the pointer.',
  state: () => ({
    ...newLag(),
    blobs: Array.from({ length: 4 }, (_, i) => ({
      a: (i / 4) * TAU, d: 8 + i * 3, r: 7 + (i % 3) * 3, sp: 0.4 + i * 0.2,
    })),
  }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 9, dt);
    c.globalCompositeOperation = 'lighter';
    for (const b of s.blobs) {
      b.a += dt * b.sp;
      const x = s.x + Math.cos(b.a) * b.d * scale;
      const y = s.y + Math.sin(b.a * 1.3) * b.d * scale;
      const g = c.createRadialGradient(x, y, 0, x, y, b.r * scale * 2);
      g.addColorStop(0, rgba(col, 0.6));
      g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, b.r * scale * 2, 0, TAU);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  },
};

export const mercuryBead: CursorStyle<Lag & { squash: number }> = {
  id: 'mercury',
  name: 'Mercury',
  category: 'fluid',
  blurb: 'A bead of liquid metal with a hard rim highlight and a mirrored core.',
  state: () => ({ ...newLag(), squash: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 14, dt);
    s.squash = damp(s.squash, clamp(p.speed / 1800, 0, 1), 8, dt);
    const r = 15 * scale * (1 + p.hoverAmt * 0.3);
    c.save();
    c.translate(s.x, s.y);
    c.rotate(p.angle);
    c.scale(1 + s.squash * 0.4, 1 - s.squash * 0.22);
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r);
    g.addColorStop(0, rgba(WHITE, 1));
    g.addColorStop(0.35, rgba(col, 1));
    g.addColorStop(0.82, rgba(mixRGB(col, { r: 0, g: 0, b: 0 }, 0.6), 1));
    g.addColorStop(1, rgba(mixRGB(col, WHITE, 0.5), 1));
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, r, 0, TAU);
    c.fill();
    c.restore();
  },
};

export const smokeRing: CursorStyle<{ rings: Array<{ r: number; a: number }> }> = {
  id: 'smoke-ring',
  name: 'Smoke Ring',
  category: 'fluid',
  blurb: 'Vortex rings shed from the pointer, widening and thinning as they go.',
  state: () => ({ rings: Array.from({ length: 6 }, () => ({ r: 0, a: 0 })) }),
  draw({ c, p, col, scale, dt, rnd, calm }, s) {
    let spawned = false;
    for (const r of s.rings) {
      if (r.a <= 0) {
        if (!spawned && !calm && rnd() < 0.08) {
          r.a = 1;
          r.r = 4;
          spawned = true;
        }
        continue;
      }
      r.a -= dt * 0.75;
      r.r += dt * 40;
      c.strokeStyle = rgba(col, clamp(r.a, 0, 1) * 0.5);
      c.lineWidth = (1 + (1 - r.a) * 3) * scale;
      c.beginPath();
      c.ellipse(p.x, p.y, r.r * scale, r.r * scale * 0.55, 0, 0, TAU);
      c.stroke();
    }
    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(p.x, p.y, 4 * scale, 0, TAU);
    c.fill();
  },
};

/* ------------------------------------------------------------------ trails */

export const doubleHelix: CursorStyle = {
  id: 'double-helix',
  name: 'Double Helix',
  category: 'trail',
  trail: 56,
  blurb: 'Two strands winding around your path, crossing where they meet.',
  draw({ c, p, col, col2, scale, t }) {
    if (p.trailLen < 6) return;
    for (const [phase, colour] of [[0, col], [Math.PI, col2]] as const) {
      c.strokeStyle = rgba(colour, 0.85);
      c.lineWidth = 2 * scale;
      c.beginPath();
      for (let i = 0; i < 22; i++) {
        const x = tx(p, i * 1.6);
        const y = ty(p, i * 1.6);
        const nx = tx(p, i * 1.6 + 1) - x;
        const ny = ty(p, i * 1.6 + 1) - y;
        const len = Math.hypot(nx, ny) || 1;
        // Offset perpendicular to the path, oscillating along its length.
        const off = Math.sin(i * 0.55 - t * 4 + phase) * 8 * scale;
        const px = x + (-ny / len) * off;
        const py = y + (nx / len) * off;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
    }
  },
};

export const dashTrail: CursorStyle = {
  id: 'dash-trail',
  name: 'Dashed Path',
  category: 'trail',
  trail: 56,
  blurb: 'Your path drawn as a dashed rule, like a route on a map.',
  draw({ c, p, col, scale }) {
    if (p.trailLen < 4) return;
    const pts: number[] = [];
    for (let i = 0; i < 24; i++) pts.push(tx(p, i * 1.6), ty(p, i * 1.6));
    c.save();
    c.setLineDash([6 * scale, 5 * scale]);
    c.strokeStyle = rgba(col, 0.75);
    c.lineWidth = 1.8 * scale;
    polyline(c, pts);
    c.stroke();
    c.restore();
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 3.6 * scale, 0, TAU);
    c.fill();
  },
};

export const wakeTrail: CursorStyle = {
  id: 'wake',
  name: 'Wake',
  category: 'trail',
  trail: 56,
  blurb: 'A widening V behind the pointer, like the wake of a boat.',
  draw({ c, p, col, scale }) {
    if (p.trailLen < 6) return;
    for (const side of [-1, 1]) {
      c.strokeStyle = rgba(col, 0.45);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      for (let i = 0; i < 20; i++) {
        const x = tx(p, i * 1.7);
        const y = ty(p, i * 1.7);
        const nx = tx(p, i * 1.7 + 1) - x;
        const ny = ty(p, i * 1.7 + 1) - y;
        const len = Math.hypot(nx, ny) || 1;
        const spread = i * 1.1 * scale * side;
        const px = x + (-ny / len) * spread;
        const py = y + (nx / len) * spread;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
    }
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 4 * scale, 0, TAU);
    c.fill();
  },
};

export const echoRings: CursorStyle = {
  id: 'echo-rings',
  name: 'Echo',
  category: 'trail',
  trail: 56,
  blurb: 'Rings dropped along your path at intervals, shrinking behind you.',
  draw({ c, p, col, scale }) {
    for (let i = 8; i >= 1; i--) {
      const x = tx(p, i * 4);
      const y = ty(p, i * 4);
      c.strokeStyle = rgba(col, (1 - i / 9) * 0.6);
      c.lineWidth = 1.3 * scale;
      c.beginPath();
      c.arc(x, y, (11 - i) * scale, 0, TAU);
      c.stroke();
    }
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 3.4 * scale, 0, TAU);
    c.fill();
  },
};

/* --------------------------------------------------------------- particles */

export const fireflies: CursorStyle<{ bits: Array<{ a: number; d: number; ph: number; sp: number }> }> = {
  id: 'fireflies',
  name: 'Fireflies',
  category: 'particle',
  blend: 'screen',
  blurb: 'Slow points of light drifting around the pointer, pulsing out of phase.',
  state: () => ({
    bits: Array.from({ length: 9 }, (_, i) => ({
      a: (i / 9) * TAU, d: 16 + (i % 4) * 9, ph: i * 0.9, sp: 0.25 + (i % 3) * 0.18,
    })),
  }),
  draw({ c, p, col, scale, dt, t }, s) {
    c.globalCompositeOperation = 'lighter';
    for (const b of s.bits) {
      b.a += dt * b.sp;
      const wob = noise1(b.ph + t * 0.5) * 8;
      const x = p.x + Math.cos(b.a) * (b.d + wob) * scale;
      const y = p.y + Math.sin(b.a * 1.2) * (b.d + wob) * scale;
      const glow = (Math.sin(t * 2 + b.ph) * 0.5 + 0.5) * 0.8 + 0.2;
      const r = 5 * scale * glow;
      const g = c.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, rgba(col, glow));
      g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r * 3, 0, TAU);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  },
};

export const dustMotes: CursorStyle<{ bits: Array<{ x: number; y: number; a: number; s: number }> }> = {
  id: 'dust-motes',
  name: 'Dust',
  category: 'particle',
  blurb: 'Fine motes disturbed by the pointer, settling slowly back down.',
  state: () => ({ bits: Array.from({ length: 40 }, () => ({ x: 0, y: 0, a: 0, s: 1 })) }),
  draw({ c, p, col, scale, dt, rnd }, s) {
    let made = 0;
    for (const b of s.bits) {
      if (b.a <= 0) {
        if (made++ > 1 || rnd() > 0.5) continue;
        b.x = p.x + (rnd() - 0.5) * 34 * scale;
        b.y = p.y + (rnd() - 0.5) * 34 * scale;
        b.a = 1;
        b.s = (0.6 + rnd() * 1.6) * scale;
        continue;
      }
      b.a -= dt * 0.5;
      b.y += 8 * dt;
      b.x += Math.sin(b.a * 6) * 5 * dt;
      c.fillStyle = rgba(col, clamp(b.a, 0, 1) * 0.55);
      c.beginPath();
      c.arc(b.x, b.y, b.s, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(p.x, p.y, 3 * scale, 0, TAU);
    c.fill();
  },
};

export const emberRise: CursorStyle<{ bits: Array<{ x: number; y: number; vy: number; a: number; s: number }> }> = {
  id: 'ember-rise',
  name: 'Embers',
  category: 'particle',
  blend: 'screen',
  blurb: 'Hot flecks that rise and cool, drifting upward rather than falling.',
  state: () => ({ bits: Array.from({ length: 46 }, () => ({ x: 0, y: 0, vy: 0, a: 0, s: 1 })) }),
  draw({ c, p, col, col2, scale, dt, rnd }, s) {
    let made = 0;
    c.globalCompositeOperation = 'lighter';
    for (const b of s.bits) {
      if (b.a <= 0) {
        if (made++ > 1) continue;
        b.x = p.x + (rnd() - 0.5) * 14 * scale;
        b.y = p.y;
        b.vy = -30 - rnd() * 60;
        b.a = 1;
        b.s = (1 + rnd() * 2.4) * scale;
        continue;
      }
      b.a -= dt * 0.9;
      b.y += b.vy * dt;
      b.x += Math.sin(b.y * 0.06) * 14 * dt;
      const k = clamp(b.a, 0, 1);
      c.fillStyle = rgba(mixRGB(col2, col, 1 - k), k * 0.9);
      c.beginPath();
      c.arc(b.x, b.y, b.s * k, 0, TAU);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(p.x, p.y, 3.4 * scale, 0, TAU);
    c.fill();
  },
};

export const orbitDots: CursorStyle<{ spin: number }> = {
  id: 'orbit-dots',
  name: 'Orbit',
  category: 'particle',
  blurb: 'Three satellites on tilted, differently timed orbits around the point.',
  state: () => ({ spin: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    s.spin += dt * (1 + p.hoverAmt * 2);
    const r = 20 * scale * (1 + p.hoverAmt * 0.4);
    for (let i = 0; i < 3; i++) {
      const a = s.spin * (1 + i * 0.35) + (i / 3) * TAU;
      const tilt = 0.4 + i * 0.25;
      const x = p.x + Math.cos(a) * r;
      const y = p.y + Math.sin(a) * r * tilt;
      // Behind the core reads dimmer, which gives the orbits depth.
      const behind = Math.sin(a) < 0;
      c.fillStyle = rgba(i % 2 ? col2 : col, behind ? 0.35 : 0.95);
      c.beginPath();
      c.arc(x, y, 3 * scale, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 4.4 * scale, 0, TAU);
    c.fill();
  },
};

/* -------------------------------------------------------------------- tech */

export const waveform: CursorStyle<{ hist: number[] }> = {
  id: 'waveform',
  name: 'Waveform',
  category: 'tech',
  blurb: 'A live oscilloscope trace of how fast you have been moving.',
  state: () => ({ hist: new Array(32).fill(0) }),
  draw({ c, p, col, scale }, s) {
    // Shift a real history buffer so the trace scrolls like an instrument.
    s.hist.copyWithin(0, 1);
    s.hist[s.hist.length - 1] = clamp(p.speed / 2000, 0, 1);
    const w = 46 * scale;
    const h = 16 * scale;
    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = 1.4 * scale;
    c.beginPath();
    for (let i = 0; i < s.hist.length; i++) {
      const x = p.x - w / 2 + (i / (s.hist.length - 1)) * w;
      const y = p.y + h / 2 - s.hist[i] * h;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    c.strokeStyle = rgba(col, 0.25);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(p.x - w / 2, p.y + h / 2);
    c.lineTo(p.x + w / 2, p.y + h / 2);
    c.stroke();
  },
};

export const wireframeCube: CursorStyle<{ rx: number; ry: number }> = {
  id: 'wireframe-cube',
  name: 'Wireframe Cube',
  category: 'tech',
  blurb: 'A rotating cube in real perspective, tumbling as you move.',
  state: () => ({ rx: 0.6, ry: 0.6 }),
  draw({ c, p, col, scale, dt }, s) {
    s.rx += dt * 0.5 + p.vy * dt * 0.0012;
    s.ry += dt * 0.7 + p.vx * dt * 0.0012;
    const r = 13 * scale * (1 + p.hoverAmt * 0.35);

    const verts: Array<[number, number, number]> = [];
    for (let i = 0; i < 8; i++) {
      verts.push([(i & 1 ? 1 : -1), (i & 2 ? 1 : -1), (i & 4 ? 1 : -1)]);
    }
    const proj = verts.map(([x, y, z]) => {
      // Y then X rotation, then a weak perspective divide.
      let a = x * Math.cos(s.ry) - z * Math.sin(s.ry);
      let b = x * Math.sin(s.ry) + z * Math.cos(s.ry);
      const cY = y * Math.cos(s.rx) - b * Math.sin(s.rx);
      const cZ = y * Math.sin(s.rx) + b * Math.cos(s.rx);
      const persp = 2.6 / (2.6 + cZ);
      return [p.x + a * r * persp, p.y + cY * r * persp] as const;
    });

    const edges = [
      [0, 1], [1, 3], [3, 2], [2, 0],
      [4, 5], [5, 7], [7, 6], [6, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = 1.3 * scale;
    c.beginPath();
    for (const [a, b] of edges) {
      c.moveTo(proj[a][0], proj[a][1]);
      c.lineTo(proj[b][0], proj[b][1]);
    }
    c.stroke();
  },
};

export const barMeter: CursorStyle<{ bars: number[] }> = {
  id: 'bar-meter',
  name: 'Level Meter',
  category: 'tech',
  blurb: 'A five-segment level meter that lights up with your pointer speed.',
  state: () => ({ bars: new Array(5).fill(0) }),
  draw({ c, p, col, col2, scale, dt }, s) {
    const level = clamp(p.speed / 1800, 0, 1) * s.bars.length;
    for (let i = 0; i < s.bars.length; i++) {
      // Fast attack, slow release — the behaviour of an actual VU meter.
      const target = level > i ? 1 : 0;
      s.bars[i] = damp(s.bars[i], target, target ? 30 : 6, dt);
      const on = s.bars[i];
      const x = p.x - 15 * scale + i * 7 * scale;
      const h = (5 + i * 2.6) * scale;
      c.fillStyle = rgba(i >= 3 ? col2 : col, 0.15 + on * 0.8);
      c.fillRect(x, p.y + 8 * scale - h, 4.6 * scale, h);
    }
  },
};

export const nodeGraph: CursorStyle<{ spin: number }> = {
  id: 'node-graph',
  name: 'Node Graph',
  category: 'tech',
  blurb: 'A small connected graph of nodes rotating around the pointer.',
  state: () => ({ spin: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    s.spin += dt * 0.45;
    const n = 5;
    const r = 18 * scale * (1 + p.hoverAmt * 0.35);
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      const a = s.spin + (i / n) * TAU;
      pts.push([p.x + Math.cos(a) * r, p.y + Math.sin(a) * r]);
    }
    c.strokeStyle = rgba(col, 0.4);
    c.lineWidth = 1 * scale;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      // Connect to the node two along, which produces a star polygon rather
      // than a plain ring.
      const j = (i + 2) % n;
      c.moveTo(pts[i][0], pts[i][1]);
      c.lineTo(pts[j][0], pts[j][1]);
    }
    c.stroke();
    for (const [x, y] of pts) {
      c.fillStyle = rgba(col2, 0.95);
      c.beginPath();
      c.arc(x, y, 2.6 * scale, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 3 * scale, 0, TAU);
    c.fill();
  },
};

export const loadingSpinner: CursorStyle<{ spin: number }> = {
  id: 'spinner',
  name: 'Spinner',
  category: 'tech',
  blurb: 'A twelve-spoke indeterminate spinner, permanently working.',
  state: () => ({ spin: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    s.spin += dt * 3.4;
    const r = 13 * scale * (1 + p.hoverAmt * 0.35);
    const spokes = 12;
    const step = Math.floor((s.spin / TAU) * spokes);
    c.lineCap = 'round';
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * TAU;
      // Discrete stepping is what makes a spinner read as a spinner.
      const age = ((i - step) % spokes + spokes) % spokes;
      c.strokeStyle = rgba(col, 0.12 + (1 - age / spokes) * 0.88);
      c.lineWidth = 2.2 * scale;
      c.beginPath();
      c.moveTo(p.x + Math.cos(a) * r * 0.52, p.y + Math.sin(a) * r * 0.52);
      c.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
      c.stroke();
    }
  },
};

/* ----------------------------------------------------------------- playful */

export const catPaw: CursorStyle<Lag> = {
  id: 'cat-paw',
  name: 'Paw',
  category: 'playful',
  blurb: 'A soft paw print with four toe beans that splay when you press.',
  state: newLag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 17, dt);
    const r = 11 * scale * (1 + p.hoverAmt * 0.25);
    const splay = 1 + p.press * 0.25;
    c.fillStyle = rgba(col, 0.96);
    c.beginPath();
    c.ellipse(s.x, s.y + r * 0.28, r * 0.82, r * 0.68, 0, 0, TAU);
    c.fill();
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI * 0.86 + (i / 3) * Math.PI * 0.72;
      const d = r * 1.02 * splay;
      c.beginPath();
      c.ellipse(
        s.x + Math.cos(a) * d, s.y + Math.sin(a) * d * 0.9,
        r * 0.26, r * 0.32, a + HALF_PI, 0, TAU,
      );
      c.fill();
    }
  },
};

export const speechBubble: CursorStyle<Lag> = {
  id: 'speech-bubble',
  name: 'Speech Bubble',
  category: 'playful',
  blurb: 'A bubble that inflates and says what the element under it is called.',
  state: newLag,
  draw({ c, p, col, scale, dt, w: vw }, s) {
    follow(s, p.x, p.y, 15, dt);
    const label = p.label;
    const open = label ? p.hoverAmt : 0;

    c.font = `600 ${11 * scale}px ui-sans-serif, system-ui, sans-serif`;
    const tw = label ? c.measureText(label).width : 0;
    const w = lerp(16 * scale, Math.min(tw + 20 * scale, vw * 0.5), open);
    const h = lerp(14 * scale, 24 * scale, open);
    const bx = s.x + 12 * scale;
    const by = s.y - h - 8 * scale;

    c.fillStyle = rgba(col, 0.96);
    roundRect(c, bx, by, w, h, Math.min(8 * scale, h / 2));
    c.fill();
    c.beginPath();
    c.moveTo(bx + 6 * scale, by + h);
    c.lineTo(bx + 4 * scale, by + h + 6 * scale);
    c.lineTo(bx + 14 * scale, by + h);
    c.closePath();
    c.fill();

    if (open > 0.55 && label) {
      const lum = (0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b) / 255;
      c.fillStyle = lum > 0.6 ? 'rgba(10,13,19,0.95)' : 'rgba(255,255,255,0.97)';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.globalAlpha = (open - 0.55) / 0.45;
      c.fillText(label, bx + 10 * scale, by + h / 2);
      c.globalAlpha = 1;
    }
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 3 * scale, 0, TAU);
    c.fill();
  },
};

export const partyPopper: CursorStyle<{ spin: number }> = {
  id: 'party-popper',
  name: 'Popper',
  category: 'playful',
  blurb: 'A cone trailing tiny streamers, tipping toward the way you move.',
  state: () => ({ spin: 0 }),
  draw({ c, p, col, col2, scale, dt, t }, s) {
    s.spin = damp(s.spin, p.angle, 8, dt);
    const r = 14 * scale;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(s.spin + Math.PI);
    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(r, -r * 0.45);
    c.lineTo(r, r * 0.45);
    c.closePath();
    c.fill();
    for (let i = 0; i < 5; i++) {
      const a = -0.5 + (i / 4);
      c.strokeStyle = rgba(shiftHue(col2, i * 60), 0.85);
      c.lineWidth = 1.6 * scale;
      c.beginPath();
      c.moveTo(r, a * r * 0.7);
      c.quadraticCurveTo(
        r * 1.6, a * r + Math.sin(t * 4 + i) * 3 * scale,
        r * 2.3, a * r * 1.6,
      );
      c.stroke();
    }
    c.restore();
  },
};

export const moonPhase: CursorStyle<Lag & { phase: number }> = {
  id: 'moon-phase',
  name: 'Moon',
  category: 'playful',
  blurb: 'A moon cycling through its phases as you travel across the page.',
  state: () => ({ ...newLag(), phase: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 13, dt);
    s.phase += dt * 0.35;
    const r = 13 * scale * (1 + p.hoverAmt * 0.3);
    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(s.x, s.y, r, 0, TAU);
    c.fill();
    // The terminator is an ellipse whose width tracks the phase.
    const k = Math.cos(s.phase);
    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    c.ellipse(s.x + r * k * 0.5, s.y, r * Math.abs(k), r, 0, 0, TAU);
    if (k > 0) c.rect(s.x - r * 2, s.y - r, r * 2, r * 2);
    c.fill();
    c.globalCompositeOperation = 'source-over';
  },
};

export const balloonDog: CursorStyle<Lag & { wob: number }> = {
  id: 'crown',
  name: 'Crown',
  category: 'playful',
  blurb: 'A little crown with three points and a jewelled band.',
  state: () => ({ ...newLag(), wob: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    follow(s, p.x, p.y, 16, dt);
    s.wob = damp(s.wob, clamp(-p.vx / 900, -1, 1), 6, dt);
    const w = 22 * scale * (1 + p.hoverAmt * 0.2);
    const h = 16 * scale;
    c.save();
    c.translate(s.x, s.y);
    c.rotate(s.wob * 0.2);
    c.fillStyle = rgba(col, 0.96);
    c.beginPath();
    c.moveTo(-w / 2, h / 2);
    c.lineTo(-w / 2, -h * 0.2);
    c.lineTo(-w * 0.25, h * 0.12);
    c.lineTo(0, -h / 2);
    c.lineTo(w * 0.25, h * 0.12);
    c.lineTo(w / 2, -h * 0.2);
    c.lineTo(w / 2, h / 2);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(col2, 0.95);
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.arc(i * w * 0.28, h * 0.3, 1.8 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  },
};

/* ------------------------------------------------------------------ luxury */

export const serifBar: CursorStyle<Lag> = {
  id: 'serif-bar',
  name: 'Serif Bar',
  category: 'luxury',
  blurb: 'A single fine rule with bracketed ends, set like a rule in a book.',
  state: newLag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 9, dt);
    const w = 30 * scale * (1 + p.hoverAmt * 0.35);
    c.strokeStyle = rgba(col, 0.85);
    c.lineWidth = 0.9 * scale;
    c.beginPath();
    c.moveTo(s.x - w, s.y);
    c.lineTo(s.x + w, s.y);
    c.moveTo(s.x - w, s.y - 4 * scale);
    c.lineTo(s.x - w, s.y + 4 * scale);
    c.moveTo(s.x + w, s.y - 4 * scale);
    c.lineTo(s.x + w, s.y + 4 * scale);
    c.stroke();
  },
};

export const pearlString: CursorStyle = {
  id: 'pearl-string',
  name: 'Pearls',
  category: 'luxury',
  trail: 48,
  blurb: 'A strand of pearls following your path, each with its own lustre.',
  draw({ c, p, col, scale }) {
    for (let i = 7; i >= 0; i--) {
      const x = tx(p, i * 3);
      const y = ty(p, i * 3);
      const r = (5.5 - i * 0.35) * scale;
      const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r);
      g.addColorStop(0, rgba(WHITE, 0.95));
      g.addColorStop(0.6, rgba(col, 0.9));
      g.addColorStop(1, rgba(mixRGB(col, { r: 40, g: 30, b: 30 }, 0.4), 0.9));
      c.fillStyle = g;
      c.globalAlpha = 1 - i * 0.09;
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  },
};

export const artDeco: CursorStyle<Lag & { spin: number }> = {
  id: 'art-deco',
  name: 'Deco Fan',
  category: 'luxury',
  blurb: 'A fanned deco motif with stepped rays and a fine outer arc.',
  state: () => ({ ...newLag(), spin: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 12, dt);
    s.spin += dt * 0.18;
    const r = 20 * scale * (1 + p.hoverAmt * 0.3);
    c.save();
    c.translate(s.x, s.y);
    c.rotate(s.spin);
    c.strokeStyle = rgba(col, 0.85);
    c.lineWidth = 0.9 * scale;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.5 + (i / 6 - 0.5) * Math.PI * 0.75;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      c.stroke();
    }
    for (let i = 1; i <= 3; i++) {
      c.beginPath();
      c.arc(0, 0, r * (i / 3), -Math.PI * 0.87, -Math.PI * 0.13);
      c.stroke();
    }
    c.restore();
  },
};

export const signetRing: CursorStyle<Lag> = {
  id: 'signet',
  name: 'Signet',
  category: 'luxury',
  blurb: 'An oval signet face with a bevelled edge and an engraved initial.',
  state: newLag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 11, dt);
    const rx = 15 * scale * (1 + p.hoverAmt * 0.25);
    const ry = rx * 1.18;
    const g = c.createLinearGradient(s.x - rx, s.y - ry, s.x + rx, s.y + ry);
    g.addColorStop(0, rgba(mixRGB(col, WHITE, 0.6), 1));
    g.addColorStop(0.5, rgba(col, 1));
    g.addColorStop(1, rgba(mixRGB(col, { r: 0, g: 0, b: 0 }, 0.5), 1));
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(s.x, s.y, rx, ry, 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(mixRGB(col, WHITE, 0.7), 0.6);
    c.lineWidth = 1 * scale;
    c.stroke();

    const letter = (p.label || 'M').trim().charAt(0).toUpperCase() || 'M';
    c.font = `${14 * scale}px Didot, "Bodoni MT", Georgia, serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = rgba(mixRGB(col, { r: 0, g: 0, b: 0 }, 0.55), 0.9);
    c.fillText(letter, s.x, s.y + 1 * scale);
  },
};

export const moreStyles: CursorStyle<any>[] = [
  dotOnly, dotHalo, tickRing, squareDot, arcPair,
  chevronStack, triangleOutline, nestedSquares, barCross, pentagram,
  jelly, lavaLamp, mercuryBead, smokeRing,
  doubleHelix, dashTrail, wakeTrail, echoRings,
  fireflies, dustMotes, emberRise, orbitDots,
  waveform, wireframeCube, barMeter, nodeGraph, loadingSpinner,
  catPaw, speechBubble, partyPopper, moonPhase, balloonDog,
  serifBar, pearlString, artDeco, signetRing,
];
