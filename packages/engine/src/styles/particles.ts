import {
  TAU,
  clamp,
  damp,
  lerp,
  mixRGB,
  polyline,
  rgba,
  sparkle,
  star,
} from '@ck/math';
import type { Ctx, CursorStyle } from '../core/types';

/**
 * Particle styles.
 *
 * Every one of these runs on the same fixed-capacity pool: particles are
 * allocated once at state creation and recycled forever after. No allocation
 * in the draw path means no GC pauses, which is the difference between a
 * particle cursor that holds 60fps and one that stutters every few seconds.
 */

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  seed: number;
  size: number;
  live: boolean;
}

interface Pool {
  ps: P[];
  head: number;
  budget: number;
}

const pool = (n: number): (() => Pool) => () => ({
  ps: Array.from({ length: n }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, seed: 0, size: 1, live: false,
  })),
  head: 0,
  budget: 0,
});

/** Grabs the next slot, overwriting the oldest if the pool is saturated. */
function take(s: Pool): P {
  const p = s.ps[s.head];
  s.head = (s.head + 1) % s.ps.length;
  p.age = 0;
  p.live = true;
  return p;
}

/**
 * Rate-limited emission. `perSec` is scaled by pointer speed so a resting
 * cursor emits a trickle and a fast one leaves a dense trail — the alternative,
 * emitting per frame, ties density to the visitor's refresh rate.
 */
function emit(s: Pool, ctx: Ctx, perSec: number, spawn: (p: P) => void): void {
  const { p, dt } = ctx;
  const rate = perSec * (0.25 + clamp(p.speed / 900, 0, 1) * 1.5);
  s.budget += rate * dt;
  let n = Math.floor(s.budget);
  s.budget -= n;
  if (n > 6) n = 6; // never catch up after a stall
  while (n-- > 0) spawn(take(s));
}

/** Advances ages and culls. Returns nothing; styles read `live` themselves. */
function age(s: Pool, dt: number): void {
  for (const p of s.ps) {
    if (!p.live) continue;
    p.age += dt;
    if (p.age >= p.life) p.live = false;
  }
}

export const particleSparks: CursorStyle<Pool> = {
  id: 'particle-sparks',
  name: 'Sparks',
  category: 'particle',
  blurb: 'Hot embers thrown off the pointer, cooling from white to your colour.',
  state: pool(90),
  draw(ctx, s) {
    const { c, p, col, col2, scale, dt } = ctx;
    emit(s, ctx, 34, (q) => {
      const a = p.angle + Math.PI + (ctx.rnd() - 0.5) * 1.5;
      const sp = 40 + ctx.rnd() * 210;
      q.x = p.x;
      q.y = p.y;
      q.vx = Math.cos(a) * sp;
      q.vy = Math.sin(a) * sp;
      q.life = 0.32 + ctx.rnd() * 0.42;
      q.size = 0.6 + ctx.rnd() * 1.5;
      q.seed = ctx.rnd();
    });
    age(s, dt);

    const hot = { r: 255, g: 245, b: 220 };
    for (const q of s.ps) {
      if (!q.live) continue;
      const k = q.age / q.life;
      q.vy += 260 * dt; // embers fall
      q.vx *= 1 - 2.6 * dt;
      q.vy *= 1 - 1.2 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      // Streak each spark along its own velocity — points read as dust, short
      // motion-aligned lines read as sparks.
      const l = Math.min(Math.hypot(q.vx, q.vy) * 0.02, 7) * scale;
      const a = Math.atan2(q.vy, q.vx);
      c.strokeStyle = rgba(mixRGB(hot, k > 0.4 ? col2 : col, clamp(k * 1.8, 0, 1)), (1 - k) * 0.95);
      c.lineWidth = q.size * scale;
      c.beginPath();
      c.moveTo(q.x, q.y);
      c.lineTo(q.x - Math.cos(a) * l, q.y - Math.sin(a) * l);
      c.stroke();
    }

    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 3.4 * scale * (1 + p.hoverAmt * 0.5), 0, TAU);
    c.fill();
  },
};

export const particleStars: CursorStyle<Pool> = {
  id: 'particle-stars',
  name: 'Stardust',
  category: 'particle',
  blurb: 'Four-point sparkles that tumble slowly and twinkle out.',
  state: pool(60),
  draw(ctx, s) {
    const { c, p, col, col2, scale, dt, t } = ctx;
    emit(s, ctx, 16, (q) => {
      q.x = p.x + (ctx.rnd() - 0.5) * 18 * scale;
      q.y = p.y + (ctx.rnd() - 0.5) * 18 * scale;
      q.vx = (ctx.rnd() - 0.5) * 40;
      q.vy = (ctx.rnd() - 0.5) * 40 - 18;
      q.life = 0.7 + ctx.rnd() * 0.7;
      q.size = (2.5 + ctx.rnd() * 4) * scale;
      q.seed = ctx.rnd() * TAU;
    });
    age(s, dt);

    for (const q of s.ps) {
      if (!q.live) continue;
      const k = q.age / q.life;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 30 * dt;
      // Sine envelope: born small, brightest mid-life, gone at the end.
      const grow = Math.sin(k * Math.PI);
      c.fillStyle = rgba(k > 0.5 ? col2 : col, grow * 0.95);
      sparkle(c, q.x, q.y, q.size * grow, q.seed + t * 0.9);
      c.fill();
    }

    c.fillStyle = rgba(col, 1);
    sparkle(c, p.x, p.y, 7 * scale * (1 + p.hoverAmt * 0.4 - p.press * 0.2), t * 0.6);
    c.fill();
  },
};

export const particleBubbles: CursorStyle<Pool> = {
  id: 'particle-bubbles',
  name: 'Bubbles',
  category: 'particle',
  blurb: 'Rings that drift upward, wobble, and pop at the top of their arc.',
  state: pool(50),
  draw(ctx, s) {
    const { c, p, col, scale, dt } = ctx;
    emit(s, ctx, 13, (q) => {
      q.x = p.x + (ctx.rnd() - 0.5) * 20 * scale;
      q.y = p.y + (ctx.rnd() - 0.5) * 10 * scale;
      q.vx = (ctx.rnd() - 0.5) * 26;
      q.vy = -30 - ctx.rnd() * 55;
      q.life = 0.9 + ctx.rnd() * 1;
      q.size = (2.5 + ctx.rnd() * 6) * scale;
      q.seed = ctx.rnd() * TAU;
    });
    age(s, dt);

    for (const q of s.ps) {
      if (!q.live) continue;
      const k = q.age / q.life;
      q.seed += dt * 3;
      q.x += (q.vx + Math.sin(q.seed) * 22) * dt;
      q.y += q.vy * dt;

      if (k > 0.82) {
        // The pop: expand and fade over the last fifth of life.
        const pk = (k - 0.82) / 0.18;
        c.strokeStyle = rgba(col, (1 - pk) * 0.8);
        c.lineWidth = 1 * scale;
        c.beginPath();
        c.arc(q.x, q.y, q.size * (1 + pk * 1.5), 0, TAU);
        c.stroke();
        continue;
      }

      c.strokeStyle = rgba(col, 0.55);
      c.lineWidth = 1.2 * scale;
      c.beginPath();
      c.arc(q.x, q.y, q.size, 0, TAU);
      c.stroke();
      // Specular highlight, offset up-left. Without it they read as O's.
      c.fillStyle = rgba(col, 0.5);
      c.beginPath();
      c.arc(q.x - q.size * 0.32, q.y - q.size * 0.32, q.size * 0.2, 0, TAU);
      c.fill();
    }

    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 1.6 * scale;
    c.beginPath();
    c.arc(p.x, p.y, 8 * scale * (1 + p.hoverAmt * 0.5), 0, TAU);
    c.stroke();
  },
};

export const particleSmoke: CursorStyle<Pool> = {
  id: 'particle-smoke',
  name: 'Smoke',
  category: 'particle',
  blurb: 'Soft volumes that expand and thin as they rise. Best on dark grounds.',
  state: pool(44),
  draw(ctx, s) {
    const { c, p, col, col2, scale, dt } = ctx;
    emit(s, ctx, 20, (q) => {
      q.x = p.x + (ctx.rnd() - 0.5) * 8 * scale;
      q.y = p.y + (ctx.rnd() - 0.5) * 8 * scale;
      q.vx = (ctx.rnd() - 0.5) * 34 - Math.cos(p.angle) * 30;
      q.vy = (ctx.rnd() - 0.5) * 34 - Math.sin(p.angle) * 30 - 14;
      q.life = 0.8 + ctx.rnd() * 0.8;
      q.size = (7 + ctx.rnd() * 9) * scale;
      q.seed = ctx.rnd();
    });
    age(s, dt);

    c.globalCompositeOperation = 'lighter';
    for (const q of s.ps) {
      if (!q.live) continue;
      const k = q.age / q.life;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 1 - 0.9 * dt;
      q.vy *= 1 - 0.9 * dt;
      const r = q.size * (0.5 + k * 1.9);
      const a = (1 - k) * (1 - k) * 0.2;
      const g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      g.addColorStop(0, rgba(q.seed > 0.5 ? col : col2, a));
      g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(q.x, q.y, r, 0, TAU);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';

    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(p.x, p.y, 3.6 * scale * (1 + p.hoverAmt * 0.5), 0, TAU);
    c.fill();
  },
};

export const particleLeaves: CursorStyle<Pool> = {
  id: 'particle-leaves',
  name: 'Drift',
  category: 'particle',
  blurb: 'Leaf shapes that flutter on their own axis as they fall away.',
  state: pool(40),
  draw(ctx, s) {
    const { c, p, col, col2, scale, dt } = ctx;
    emit(s, ctx, 11, (q) => {
      q.x = p.x;
      q.y = p.y;
      q.vx = (ctx.rnd() - 0.5) * 60;
      q.vy = 10 + ctx.rnd() * 40;
      q.life = 1.1 + ctx.rnd() * 0.9;
      q.size = (4 + ctx.rnd() * 5) * scale;
      q.seed = ctx.rnd() * TAU;
    });
    age(s, dt);

    for (const q of s.ps) {
      if (!q.live) continue;
      const k = q.age / q.life;
      q.seed += dt * 2.6;
      // Flutter: horizontal sway coupled to the same phase as the spin, so the
      // leaf appears to catch air as it turns edge-on.
      q.x += (q.vx + Math.sin(q.seed) * 48) * dt;
      q.y += q.vy * dt;
      q.vy += 42 * dt;

      c.save();
      c.translate(q.x, q.y);
      c.rotate(q.seed * 0.6);
      c.scale(1, Math.abs(Math.cos(q.seed)) * 0.8 + 0.2);
      c.fillStyle = rgba(q.seed % 2 > 1 ? col2 : col, (1 - k) * 0.9);
      c.beginPath();
      c.moveTo(0, -q.size);
      c.quadraticCurveTo(q.size * 0.85, 0, 0, q.size);
      c.quadraticCurveTo(-q.size * 0.85, 0, 0, -q.size);
      c.fill();
      c.restore();
    }

    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(p.x, p.y, 4 * scale * (1 + p.hoverAmt * 0.4), 0, TAU);
    c.fill();
  },
};

export const neonTrail: CursorStyle<{ glow: number }> = {
  id: 'neon-trail',
  name: 'Neon',
  category: 'particle',
  blurb: 'A bent glass tube of light — three passes, widest and dimmest first.',
  trail: 48,
  state: () => ({ glow: 0 }),
  draw({ c, p, col, col2, scale, dt, calm }, s) {
    s.glow = damp(s.glow, 1, 6, dt);
    if (p.trailLen < 4) return;

    const pts: number[] = [];
    for (let i = 0; i < 20; i++) {
      const j = Math.min(i * 1.6, p.trailLen - 1);
      const a = Math.floor(j);
      pts.push(p.trail[a * 2], p.trail[a * 2 + 1]);
    }

    // Real neon is additive: the halo is the same path drawn fat and faint.
    c.globalCompositeOperation = 'lighter';
    const passes = calm ? 1 : 3;
    for (let i = passes - 1; i >= 0; i--) {
      c.strokeStyle = rgba(i === 0 ? { r: 255, g: 255, b: 255 } : col2, i === 0 ? 0.95 : 0.16);
      c.lineWidth = lerp(2, 15, i / 2) * scale;
      polyline(c, pts);
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';

    const r = 5 * scale * (1 + p.hoverAmt * 0.5);
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
    g.addColorStop(0, rgba({ r: 255, g: 255, b: 255 }, 1));
    g.addColorStop(0.3, rgba(col, 0.8));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(p.x, p.y, r * 3, 0, TAU);
    c.fill();
  },
};

export const particleConstellation: CursorStyle<Pool> = {
  id: 'particle-constellation',
  name: 'Constellation',
  category: 'particle',
  blurb: 'Points that find each other, drawing lines while they are close enough.',
  state: pool(26),
  draw(ctx, s) {
    const { c, p, col, col2, scale, dt } = ctx;
    emit(s, ctx, 9, (q) => {
      q.x = p.x + (ctx.rnd() - 0.5) * 30 * scale;
      q.y = p.y + (ctx.rnd() - 0.5) * 30 * scale;
      q.vx = (ctx.rnd() - 0.5) * 44;
      q.vy = (ctx.rnd() - 0.5) * 44;
      q.life = 1.2 + ctx.rnd() * 0.8;
      q.size = (1 + ctx.rnd() * 1.6) * scale;
    });
    age(s, dt);

    const live = s.ps.filter((q) => q.live);
    for (const q of live) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 1 - 0.6 * dt;
      q.vy *= 1 - 0.6 * dt;
    }

    const reach = 62 * scale;
    c.lineWidth = 0.8 * scale;
    // Pairwise over a 26-slot pool is at most 325 checks — cheap enough to do
    // honestly rather than with a spatial index.
    for (let i = 0; i < live.length; i++) {
      const a = live[i];
      const fa = 1 - a.age / a.life;
      for (let j = i + 1; j < live.length; j++) {
        const b = live[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > reach) continue;
        c.strokeStyle = rgba(col2, (1 - d / reach) * 0.35 * fa * (1 - b.age / b.life));
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      }
      c.fillStyle = rgba(col, fa * 0.9);
      c.beginPath();
      c.arc(a.x, a.y, a.size, 0, TAU);
      c.fill();
    }

    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 3.2 * scale * (1 + p.hoverAmt * 0.5), 0, TAU);
    c.fill();
  },
};

export const particleStarfall: CursorStyle<Pool> = {
  id: 'particle-starfall',
  name: 'Starfall',
  category: 'particle',
  blurb: 'Five-point stars spinning as they scatter and settle out of frame.',
  state: pool(46),
  draw(ctx, s) {
    const { c, p, col, col2, scale, dt } = ctx;
    emit(s, ctx, 14, (q) => {
      q.x = p.x;
      q.y = p.y;
      q.vx = (ctx.rnd() - 0.5) * 130;
      q.vy = (ctx.rnd() - 0.5) * 90 - 20;
      q.life = 0.75 + ctx.rnd() * 0.7;
      q.size = (3 + ctx.rnd() * 4) * scale;
      q.seed = ctx.rnd() * TAU;
    });
    age(s, dt);

    for (const q of s.ps) {
      if (!q.live) continue;
      const k = q.age / q.life;
      q.seed += dt * 4;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 210 * dt;
      q.vx *= 1 - 1.4 * dt;
      const grow = Math.sin(k * Math.PI) * 0.6 + 0.4;
      c.fillStyle = rgba(k > 0.55 ? col2 : col, (1 - k) * 0.95);
      star(c, q.x, q.y, q.size * grow, q.size * grow * 0.44, 5, q.seed);
      c.fill();
    }

    c.fillStyle = rgba(col, 1);
    star(c, p.x, p.y, 9 * scale * (1 + p.hoverAmt * 0.35), 4 * scale, 5, ctx.t * 0.7);
    c.fill();
  },
};

export const particleStyles = [
  particleSparks,
  particleStars,
  particleBubbles,
  particleSmoke,
  particleLeaves,
  neonTrail,
  particleConstellation,
  particleStarfall,
];
