import { TAU, easeOutCubic, lerp, mixRGB, rgba, star } from '@ck/math';
import type { ClickEffect, Ctx, EffectInstance } from '../core/types';

/**
 * Particle burst family.
 *
 * Every effect here spawns a fixed set of particles at click time and
 * integrates them forward. Unlike the trail particle *styles*, these allocate
 * on spawn — a click happens a few times a second at most, so the clarity is
 * worth more than pooling.
 */

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  s: number;
  rot: number;
  spin: number;
}

interface Burst extends EffectInstance {
  bits: Bit[];
}

/** Even angular spread with jitter, so bursts never look like a clock face. */
function scatter(
  ctx: Ctx,
  n: number,
  speed: [number, number],
  size: [number, number],
): Bit[] {
  const bits: Bit[] = [];
  const base = ctx.rnd() * TAU;
  for (let i = 0; i < n; i++) {
    const a = base + (i / n) * TAU + (ctx.rnd() - 0.5) * (TAU / n) * 0.9;
    const sp = lerp(speed[0], speed[1], ctx.rnd());
    bits.push({
      x: 0,
      y: 0,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: a,
      s: lerp(size[0], size[1], ctx.rnd()),
      rot: ctx.rnd() * TAU,
      spin: (ctx.rnd() - 0.5) * 14,
    });
  }
  return bits;
}

/** Integrates one bit with drag and optional gravity. */
function step(b: Bit, dt: number, drag: number, gravity: number): void {
  b.vx *= 1 - drag * dt;
  b.vy = b.vy * (1 - drag * dt) + gravity * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.rot += b.spin * dt;
}

export const sparkBurst: ClickEffect<Burst> = {
  id: 'spark-burst',
  name: 'Sparks',
  family: 'burst',
  blurb: 'Electric filaments that fly out, streak, and burn down to nothing.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.55, k: 0, bits: scatter(ctx, 16, [220, 620], [1, 2.4]) }),
  draw({ c, col, col2, scale, dt }, e) {
    const hot = { r: 255, g: 248, b: 226 };
    for (const b of e.bits) {
      step(b, dt, 4.5, 420);
      const len = Math.min(Math.hypot(b.vx, b.vy) * 0.026, 14) * scale;
      const a = Math.atan2(b.vy, b.vx);
      c.strokeStyle = rgba(mixRGB(hot, e.k > 0.45 ? col2 : col, Math.min(e.k * 2, 1)), (1 - e.k) * 0.95);
      c.lineWidth = b.s * scale;
      c.beginPath();
      c.moveTo(e.x + b.x, e.y + b.y);
      c.lineTo(e.x + b.x - Math.cos(a) * len, e.y + b.y - Math.sin(a) * len);
      c.stroke();
    }
  },
};

export const confettiPop: ClickEffect<Burst> = {
  id: 'confetti-pop',
  name: 'Confetti',
  family: 'burst',
  blurb: 'Paper rectangles that tumble edge-on as they fall. Genuinely festive.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 1.35, k: 0, bits: scatter(ctx, 20, [140, 400], [3, 7]) }),
  draw({ c, col, col2, scale, dt }, e) {
    for (const b of e.bits) {
      step(b, dt, 2.2, 620);
      c.save();
      c.translate(e.x + b.x, e.y + b.y);
      c.rotate(b.rot);
      // Squash on the tumble axis: the piece disappears when edge-on, which is
      // what makes flat paper read as flat paper.
      c.scale(1, Math.abs(Math.cos(b.rot * 1.7)));
      c.fillStyle = rgba(b.spin > 0 ? col : col2, 1 - Math.pow(e.k, 3));
      const w = b.s * scale;
      c.fillRect(-w / 2, -w * 0.32, w, w * 0.64);
      c.restore();
    }
  },
};

export const starBurst: ClickEffect<Burst> = {
  id: 'star-burst',
  name: 'Star Burst',
  family: 'burst',
  blurb: 'Five-point stars thrown outward, spinning down as they fade.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.85, k: 0, bits: scatter(ctx, 12, [180, 460], [4, 9]) }),
  draw({ c, col, col2, scale, dt }, e) {
    for (const b of e.bits) {
      step(b, dt, 3.4, 180);
      const grow = Math.sin(Math.min(e.k * 1.4, 1) * Math.PI) * 0.5 + 0.5;
      const r = b.s * scale * grow;
      c.fillStyle = rgba(b.spin > 0 ? col : col2, (1 - e.k) * 0.95);
      star(c, e.x + b.x, e.y + b.y, r, r * 0.44, 5, b.rot);
      c.fill();
    }
  },
};

export const heartPop: ClickEffect<Burst> = {
  id: 'heart-pop',
  name: 'Heart Pop',
  family: 'burst',
  blurb: 'Hearts that rise instead of fall, drifting sideways as they go.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 1.1, k: 0, bits: scatter(ctx, 9, [70, 200], [5, 10]) }),
  draw({ c, col, col2, scale, dt }, e) {
    for (const b of e.bits) {
      // Negative gravity: hearts float up, which is the whole convention.
      step(b, dt, 2.6, -240);
      const r = b.s * scale * (0.4 + easeOutCubic(Math.min(e.k * 3, 1)) * 0.6);
      c.save();
      c.translate(e.x + b.x, e.y + b.y);
      c.rotate(Math.sin(b.rot) * 0.28);
      c.fillStyle = rgba(b.spin > 0 ? col : col2, (1 - e.k) * 0.95);
      c.beginPath();
      c.moveTo(0, r * 0.8);
      c.bezierCurveTo(-r * 1.3, -r * 0.15, -r * 0.52, -r, 0, -r * 0.36);
      c.bezierCurveTo(r * 0.52, -r, r * 1.3, -r * 0.15, 0, r * 0.8);
      c.fill();
      c.restore();
    }
  },
};

export const dotScatter: ClickEffect<Burst> = {
  id: 'dot-scatter',
  name: 'Dot Scatter',
  family: 'burst',
  blurb: 'Plain dots, evenly thrown. The minimal option when confetti is too much.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.5, k: 0, bits: scatter(ctx, 14, [200, 380], [1.6, 3.4]) }),
  draw({ c, col, scale, dt }, e) {
    for (const b of e.bits) {
      step(b, dt, 6, 0);
      c.fillStyle = rgba(col, Math.pow(1 - e.k, 1.6) * 0.9);
      c.beginPath();
      c.arc(e.x + b.x, e.y + b.y, b.s * scale * (1 - e.k * 0.55), 0, TAU);
      c.fill();
    }
  },
};

export const petalFall: ClickEffect<Burst> = {
  id: 'petal-fall',
  name: 'Petals',
  family: 'burst',
  blurb: 'Petals released in a slow bloom, swaying as they settle.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 1.5, k: 0, bits: scatter(ctx, 11, [60, 190], [5, 10]) }),
  draw({ c, col, col2, scale, dt }, e) {
    for (const b of e.bits) {
      step(b, dt, 1.7, 260);
      // Sway couples to rotation so each petal appears to catch the air.
      b.x += Math.sin(b.rot) * 30 * dt;
      const r = b.s * scale;
      c.save();
      c.translate(e.x + b.x, e.y + b.y);
      c.rotate(b.rot * 0.5);
      c.scale(1, Math.abs(Math.cos(b.rot)) * 0.7 + 0.3);
      c.fillStyle = rgba(b.spin > 0 ? col : col2, (1 - e.k) * 0.9);
      c.beginPath();
      c.ellipse(0, 0, r * 0.55, r, 0, 0, TAU);
      c.fill();
      c.restore();
    }
  },
};

export const coinBurst: ClickEffect<Burst> = {
  id: 'coin-burst',
  name: 'Coins',
  family: 'burst',
  blurb: 'Discs flipping on their own axis with a bright rim. Weighty and satisfying.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 1.05, k: 0, bits: scatter(ctx, 10, [180, 420], [5, 9]) }),
  draw({ c, col, col2, scale, dt }, e) {
    for (const b of e.bits) {
      step(b, dt, 1.9, 900);
      const r = b.s * scale;
      const flip = Math.abs(Math.cos(b.rot * 2));
      const a = (1 - e.k) * 0.95;
      c.save();
      c.translate(e.x + b.x, e.y + b.y);
      c.scale(flip, 1);
      c.fillStyle = rgba(col, a);
      c.beginPath();
      c.arc(0, 0, r, 0, TAU);
      c.fill();
      // Rim highlight reads as thickness even at this size.
      c.strokeStyle = rgba(mixRGB(col2, { r: 255, g: 252, b: 230 }, 0.6), a);
      c.lineWidth = 1.2 * scale;
      c.stroke();
      c.restore();
    }
  },
};

export const pixelBurst: ClickEffect<Burst> = {
  id: 'pixel-burst',
  name: 'Pixel Burst',
  family: 'burst',
  blurb: 'Hard-edged squares that snap to a grid as they fly. No anti-aliasing.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 0.6, k: 0, bits: scatter(ctx, 18, [160, 420], [3, 6]) }),
  draw({ c, col, col2, scale, dt }, e) {
    const grid = 4 * scale;
    for (const b of e.bits) {
      step(b, dt, 3.2, 260);
      const s = Math.max(grid, Math.round((b.s * scale * (1 - e.k)) / grid) * grid);
      if (s < 1) continue;
      // Quantising position as well as size is what sells the pixel look.
      const px = Math.round((e.x + b.x) / grid) * grid;
      const py = Math.round((e.y + b.y) / grid) * grid;
      c.fillStyle = rgba(b.spin > 0 ? col : col2, 1 - Math.pow(e.k, 2));
      c.fillRect(px, py, s, s);
    }
  },
};

export const snowBurst: ClickEffect<Burst> = {
  id: 'snow-burst',
  name: 'Snow',
  family: 'burst',
  blurb: 'Six-armed flakes drifting down on almost no gravity at all.',
  spawn: (ctx, x, y) => ({ x, y, age: 0, life: 1.6, k: 0, bits: scatter(ctx, 12, [50, 170], [3, 7]) }),
  draw({ c, col, scale, dt }, e) {
    for (const b of e.bits) {
      step(b, dt, 1.5, 110);
      b.x += Math.sin(b.rot * 0.8) * 22 * dt;
      const r = b.s * scale;
      c.save();
      c.translate(e.x + b.x, e.y + b.y);
      c.rotate(b.rot * 0.35);
      c.strokeStyle = rgba(col, (1 - e.k) * 0.9);
      c.lineWidth = 1.1 * scale;
      c.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI;
        c.moveTo(-Math.cos(a) * r, -Math.sin(a) * r);
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.stroke();
      c.restore();
    }
  },
};

export const dataScatter: ClickEffect<Burst> = {
  id: 'data-scatter',
  name: 'Data Scatter',
  family: 'burst',
  blurb: 'Hex digits flung out of the click point and decaying as they travel.',
  spawn: (ctx, x, y) => ({
    x,
    y,
    age: 0,
    life: 0.75,
    k: 0,
    bits: scatter(ctx, 14, [140, 400], [8, 13]),
  }),
  draw({ c, col, col2, scale, dt }, e) {
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const b of e.bits) {
      step(b, dt, 3.6, 120);
      c.font = `${b.s * scale}px ui-monospace,Menlo,Consolas,monospace`;
      c.fillStyle = rgba(b.spin > 0 ? col2 : col, (1 - e.k) * 0.9);
      // Digit is derived from the bit's own spin so it stays stable per particle.
      const ch = '0123456789ABCDEF'[Math.abs(Math.round(b.spin * 7)) % 16];
      c.fillText(ch, e.x + b.x, e.y + b.y);
    }
  },
};

export const burstEffects = [
  sparkBurst,
  confettiPop,
  starBurst,
  heartPop,
  dotScatter,
  petalFall,
  coinBurst,
  pixelBurst,
  snowBurst,
  dataScatter,
];
