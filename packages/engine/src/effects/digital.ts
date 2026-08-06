import { TAU, clamp, easeOutQuint, lerp, rgba, shiftHue } from '@ck/math';
import type { ClickEffect, EffectInstance } from '../core/types';

/**
 * Digital family — signal failure as decoration.
 *
 * These deliberately break the smooth-easing rule the rest of the library
 * follows. Glitches that ease look like animation; glitches that step and hold
 * look like something went wrong, which is the effect being asked for.
 */

const MONO = 'ui-monospace,Menlo,Consolas,monospace';

interface Glitch extends EffectInstance {
  bars: Array<{ y: number; h: number; o: number }>;
}

export const glitchClick: ClickEffect<Glitch> = {
  id: 'glitch-click',
  name: 'Glitch',
  family: 'digital',
  blurb: 'RGB channels tear apart and slam back together in three hard steps.',
  spawn: (ctx, x, y) => ({
    x,
    y,
    age: 0,
    life: 0.34,
    k: 0,
    bars: Array.from({ length: 5 }, () => ({
      y: (ctx.rnd() - 0.5) * 46,
      h: 2 + ctx.rnd() * 7,
      o: (ctx.rnd() - 0.5) * 40,
    })),
  }),
  draw({ c, col, scale }, e) {
    // Quantise progress to 3 steps — the hold between them is the glitch.
    const step = Math.floor(e.k * 3) / 3;
    const amp = (1 - step) * 18 * scale;
    const w = 40 * scale;

    c.globalCompositeOperation = 'lighter';
    for (const [ch, dir] of [
      [shiftHue(col, -60), -1],
      [shiftHue(col, 60), 1],
    ] as const) {
      c.fillStyle = rgba(ch, (1 - e.k) * 0.55);
      for (const b of e.bars) {
        c.fillRect(
          e.x - w / 2 + b.o * scale * (1 - step) * dir,
          e.y + b.y * scale,
          w,
          b.h * scale,
        );
      }
    }
    c.globalCompositeOperation = 'source-over';

    c.strokeStyle = rgba(col, (1 - e.k) * 0.9);
    c.lineWidth = 1.4 * scale;
    c.beginPath();
    c.moveTo(e.x - amp - 8 * scale, e.y);
    c.lineTo(e.x + amp + 8 * scale, e.y);
    c.stroke();
  },
};

export const pixelDissolve: ClickEffect<Glitch> = {
  id: 'pixel-dissolve',
  name: 'Dissolve',
  family: 'digital',
  blurb: 'A block that breaks into a grid and drops out cell by cell.',
  spawn: (ctx, x, y) => ({
    x,
    y,
    age: 0,
    life: 0.62,
    k: 0,
    // Each cell gets a threshold; it vanishes when progress passes it.
    bars: Array.from({ length: 64 }, () => ({ y: 0, h: 0, o: ctx.rnd() })),
  }),
  draw({ c, col, col2, scale }, e) {
    const cell = 5 * scale;
    const side = 8;
    const half = (side * cell) / 2;
    for (let i = 0; i < e.bars.length; i++) {
      const t = e.bars[i].o;
      if (t < e.k) continue;
      const cx = (i % side) * cell - half;
      const cy = Math.floor(i / side) * cell - half;
      // Surviving cells drift outward from the centre as the block breaks up.
      const push = e.k * 26 * scale;
      const d = Math.hypot(cx, cy) || 1;
      c.fillStyle = rgba(t > 0.5 ? col : col2, (1 - e.k) * 0.9);
      c.fillRect(
        Math.round(e.x + cx + (cx / d) * push),
        Math.round(e.y + cy + (cy / d) * push),
        cell - 1,
        cell - 1,
      );
    }
  },
};

export const scanLineBurst: ClickEffect = {
  id: 'scan-line-burst',
  name: 'Scan Lines',
  family: 'digital',
  blurb: 'Horizontal rules that sweep apart from the click and thin out.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.55, k: 0 }),
  draw({ c, col, col2, scale }, e) {
    const n = 7;
    const spread = easeOutQuint(e.k) * 54 * scale;
    const w = lerp(70, 12, e.k) * scale;
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) / ((n - 1) / 2);
      const y = e.y + off * spread;
      c.fillStyle = rgba(i % 2 ? col2 : col, (1 - e.k) * (1 - Math.abs(off) * 0.6) * 0.9);
      c.fillRect(e.x - w / 2, y, w, Math.max(1, 1.6 * scale * (1 - e.k)));
    }
  },
};

export const circuitSpark: ClickEffect<Glitch> = {
  id: 'circuit-spark',
  name: 'Circuit Spark',
  family: 'digital',
  blurb: 'Traces that route outward at right angles, lighting pads as they arrive.',
  spawn: (ctx, x, y) => ({
    x,
    y,
    age: 0,
    life: 0.8,
    k: 0,
    bars: Array.from({ length: 7 }, (_, i) => ({
      y: (i / 7) * TAU + ctx.rnd() * 0.5,
      h: 0.5 + ctx.rnd() * 0.7,
      o: ctx.rnd() * 0.25,
    })),
  }),
  draw({ c, col, col2, scale }, e) {
    c.lineWidth = 1.4 * scale;
    for (const b of e.bars) {
      const k = clamp((e.k - b.o) / (0.55 - b.o), 0, 1);
      if (k <= 0) continue;
      const len = 56 * scale * b.h * easeOutQuint(k);
      const dx = Math.cos(b.y) * len;
      const dy = Math.sin(b.y) * len;
      const horizontalFirst = Math.abs(dx) > Math.abs(dy);
      const kx = e.x + (horizontalFirst ? dx : 0);
      const ky = e.y + (horizontalFirst ? 0 : dy);

      c.strokeStyle = rgba(col, (1 - e.k) * 0.85);
      c.beginPath();
      c.moveTo(e.x, e.y);
      c.lineTo(kx, ky);
      c.lineTo(e.x + dx, e.y + dy);
      c.stroke();

      // The pad only lights once the trace has actually reached it.
      if (k > 0.95) {
        c.fillStyle = rgba(col2, (1 - e.k) * 0.95);
        c.beginPath();
        c.arc(e.x + dx, e.y + dy, 2.6 * scale, 0, TAU);
        c.fill();
      }
    }
  },
};

export const dataDump: ClickEffect<Glitch> = {
  id: 'data-dump',
  name: 'Data Dump',
  family: 'digital',
  blurb: 'A column of hex that scrolls up out of the click and fades at the top.',
  spawn: (ctx, x, y) => ({
    x,
    y,
    age: 0,
    life: 0.85,
    k: 0,
    bars: Array.from({ length: 6 }, () => ({
      y: ctx.rnd() * 16,
      h: (ctx.rnd() - 0.5) * 34,
      o: ctx.rnd(),
    })),
  }),
  draw({ c, col, col2, scale }, e) {
    const fs = 10 * scale;
    c.font = `${fs}px ${MONO}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < e.bars.length; i++) {
      const b = e.bars[i];
      const rise = easeOutQuint(e.k) * 44 * scale;
      const a = (1 - e.k) * (1 - i / e.bars.length) * 0.95;
      const word =
        Math.floor(b.o * 65535).toString(16).toUpperCase().padStart(4, '0');
      c.fillStyle = rgba(i === 0 ? col2 : col, a);
      c.fillText(word, e.x + b.h * scale, e.y - rise - i * fs * 1.2 + fs);
    }
  },
};

export const digitalEffects = [
  glitchClick,
  pixelDissolve,
  scanLineBurst,
  circuitSpark,
  dataDump,
];

export type { EffectInstance };
