import {
  HALF_PI,
  TAU,
  clamp,
  damp,
  type Lag,
  follow,
  lerp,
  newLag,
  rgba,
  roundRect,
  shiftHue,
} from '@ck/math';
import type { CursorStyle } from '../core/types';

/**
 * Tech styles — instrument panels, targeting reticles, readouts.
 *
 * These lean on a monospace face for anything with digits. The stack is spelled
 * out rather than using `monospace` alone because the generic keyword resolves
 * to something different (and usually worse) on every platform.
 */
const MONO =
  'ui-monospace,"SF Mono",SFMono-Regular,Menlo,"Cascadia Mono","Roboto Mono",Consolas,monospace';

export const scanRing: CursorStyle<Lag & { sweep: number }> = {
  id: 'scan-ring',
  name: 'Scan Ring',
  category: 'tech',
  blurb: 'A ring with an arc sweeping around it, like something acquiring a lock.',
  state: () => ({ ...newLag(), sweep: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    follow(s, p.x, p.y, 15, dt);
    s.sweep += dt * (1.6 + p.hoverAmt * 4);
    const r = 16 * scale * (1 + p.hoverAmt * 0.5);

    c.strokeStyle = rgba(col, 0.28);
    c.lineWidth = 1.2 * scale;
    c.beginPath();
    c.arc(s.x, s.y, r, 0, TAU);
    c.stroke();

    // The bright arc is drawn with a gradient along its chord so the leading
    // edge is hot and the tail falls off — a flat arc reads as a broken ring.
    c.save();
    c.translate(s.x, s.y);
    c.rotate(s.sweep);
    const g = c.createLinearGradient(r, 0, -r, 0);
    g.addColorStop(0, rgba(col2, 1));
    g.addColorStop(1, rgba(col2, 0));
    c.strokeStyle = g;
    c.lineWidth = 2.2 * scale;
    c.beginPath();
    c.arc(0, 0, r, -0.9, 0);
    c.stroke();
    c.restore();

    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(p.x, p.y, 2.4 * scale, 0, TAU);
    c.fill();
  },
};

export const radarPing: CursorStyle<{ phase: number }> = {
  id: 'radar-ping',
  name: 'Radar Ping',
  category: 'tech',
  blurb: 'A regular outward pulse on a fixed interval, indifferent to your motion.',
  state: () => ({ phase: 0 }),
  draw({ c, p, col, col2, scale, dt, calm }, s) {
    s.phase = (s.phase + dt * 0.7) % 1;
    const rings = calm ? 1 : 3;
    for (let i = 0; i < rings; i++) {
      const k = (s.phase + i / rings) % 1;
      const r = lerp(6, 46, k) * scale;
      c.strokeStyle = rgba(col2, 0.55 * Math.pow(1 - k, 2.2));
      c.lineWidth = 1.6 * scale * (1 - k * 0.6);
      c.beginPath();
      c.arc(p.x, p.y, r, 0, TAU);
      c.stroke();
    }

    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = 1.5 * scale;
    c.beginPath();
    c.arc(p.x, p.y, 6.5 * scale * (1 + p.hoverAmt * 0.6 - p.press * 0.2), 0, TAU);
    c.stroke();
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 2 * scale, 0, TAU);
    c.fill();
  },
};

export const targetingSystem: CursorStyle<Lag & { spin: number; lock: number }> = {
  id: 'targeting-system',
  name: 'Targeting',
  category: 'tech',
  blurb: 'Counter-rotating rings and tick marks that snap to a lock on hover.',
  state: () => ({ ...newLag(), spin: 0, lock: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    follow(s, p.x, p.y, 17, dt);
    s.spin += dt * 0.7;
    s.lock = damp(s.lock, p.hoverAmt, 12, dt);
    const r = 19 * scale * (1 + s.lock * 0.35 - p.press * 0.1);

    c.save();
    c.translate(s.x, s.y);

    c.strokeStyle = rgba(col, 0.7);
    c.lineWidth = 1.2 * scale;
    // Four arcs with gaps, rather than a full circle, so the crosshair lines
    // can pass cleanly through the breaks.
    for (let i = 0; i < 4; i++) {
      const a0 = i * HALF_PI + 0.28 + s.spin;
      c.beginPath();
      c.arc(0, 0, r, a0, a0 + HALF_PI - 0.56);
      c.stroke();
    }

    c.strokeStyle = rgba(col2, 0.85);
    c.lineWidth = 1 * scale;
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * HALF_PI;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      c.moveTo(dx * r * 0.42, dy * r * 0.42);
      c.lineTo(dx * (r + 6 * scale * (1 - s.lock)), dy * (r + 6 * scale * (1 - s.lock)));
    }
    c.stroke();

    // Inner ticks appear only once locked.
    if (s.lock > 0.02) {
      c.strokeStyle = rgba(col2, 0.6 * s.lock);
      c.lineWidth = 1 * scale;
      c.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU - s.spin * 2;
        c.moveTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66);
        c.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
      }
      c.stroke();
    }

    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(0, 0, 2 * scale, 0, TAU);
    c.fill();
    c.restore();
  },
};

export const hudBracket: CursorStyle<Lag & { lock: number }> = {
  id: 'hud-bracket',
  name: 'HUD Bracket',
  category: 'tech',
  blurb: 'Aviation-style corner brackets that box whatever you are pointing at.',
  state: () => ({ ...newLag(), lock: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    follow(s, p.x, p.y, 20, dt);
    s.lock = damp(s.lock, p.hoverAmt, 11, dt);

    // With a target, the brackets grow toward its bounds; without one they sit
    // at a fixed size around the pointer.
    let hw = 12 * scale;
    let hh = 12 * scale;
    let cx = s.x;
    let cy = s.y;
    if (p.hoverRect && s.lock > 0.001) {
      const r = p.hoverRect;
      hw = lerp(hw, Math.min(r.width, 320) / 2 + 7, s.lock);
      hh = lerp(hh, Math.min(r.height, 320) / 2 + 7, s.lock);
      cx = lerp(s.x, r.left + r.width / 2, s.lock);
      cy = lerp(s.y, r.top + r.height / 2, s.lock);
    }
    const leg = Math.min(hw, hh) * 0.45;

    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 1.6 * scale;
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const sx = i === 0 || i === 3 ? -1 : 1;
      const sy = i < 2 ? -1 : 1;
      const x = cx + hw * sx;
      const y = cy + hh * sy;
      c.moveTo(x - leg * sx, y);
      c.lineTo(x, y);
      c.lineTo(x, y - leg * sy);
    }
    c.stroke();

    c.strokeStyle = rgba(col2, 0.8);
    c.lineWidth = 1 * scale;
    c.beginPath();
    c.moveTo(cx - 4 * scale, cy);
    c.lineTo(cx + 4 * scale, cy);
    c.moveTo(cx, cy - 4 * scale);
    c.lineTo(cx, cy + 4 * scale);
    c.stroke();
  },
};

export const dataCursor: CursorStyle<Lag> = {
  id: 'data-cursor',
  name: 'Readout',
  category: 'tech',
  blurb: 'A live coordinate readout docked beside a small square reticle.',
  state: newLag,
  draw({ c, p, col, col2, scale, dt, w }, s) {
    follow(s, p.x, p.y, 22, dt);
    const size = 9 * scale;

    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = 1.3 * scale;
    c.strokeRect(
      Math.round(s.x - size / 2) + 0.5,
      Math.round(s.y - size / 2) + 0.5,
      size,
      size,
    );
    c.fillStyle = rgba(col, 0.95);
    c.fillRect(Math.round(p.x), Math.round(p.y), 1.5 * scale, 1.5 * scale);

    const fs = 10 * scale;
    c.font = `${fs}px ${MONO}`;
    c.textBaseline = 'middle';
    const label =
      `${String(Math.round(p.x)).padStart(4, '0')} ${String(Math.round(p.y)).padStart(4, '0')}`;
    const tw = c.measureText(label).width;
    const padX = 5 * scale;
    const boxW = tw + padX * 2;
    const boxH = fs + 7 * scale;
    // Flip the panel to the other side rather than letting it run off-screen.
    const flip = p.x + 14 * scale + boxW > w;
    const bx = flip ? s.x - 14 * scale - boxW : s.x + 14 * scale;
    const by = s.y - boxH / 2;

    c.fillStyle = rgba(col, 0.12);
    roundRect(c, bx, by, boxW, boxH, 2 * scale);
    c.fill();
    c.strokeStyle = rgba(col, 0.35);
    c.lineWidth = 1 * scale;
    c.stroke();

    c.textAlign = 'left';
    c.fillStyle = rgba(p.hoverAmt > 0.5 ? col2 : col, 0.95);
    c.fillText(label, bx + padX, by + boxH / 2 + 0.5);
  },
};

export const glitchCursor: CursorStyle<{ jitter: number; hold: number }> = {
  id: 'glitch-cursor',
  name: 'Glitch',
  category: 'tech',
  blend: 'screen',
  blurb: 'Three colour channels that separate under speed and resynchronise at rest.',
  state: () => ({ jitter: 0, hold: 0 }),
  draw({ c, p, col, scale, dt, calm, rnd }, s) {
    // Split scales with speed, plus an occasional random glitch burst.
    s.hold -= dt;
    if (!calm && s.hold <= 0 && rnd() < 0.02) s.hold = 0.06 + rnd() * 0.1;
    const target = clamp(p.speed / 1500, 0, 1) + (s.hold > 0 ? 1 : 0);
    s.jitter = damp(s.jitter, Math.min(target, 1.6), 20, dt);

    const off = s.jitter * 7 * scale;
    const r = 10 * scale * (1 + p.hoverAmt * 0.6 - p.press * 0.2);
    const channels: Array<[{ r: number; g: number; b: number }, number, number]> = [
      [shiftHue(col, -55), -off, off * 0.35],
      [col, 0, 0],
      [shiftHue(col, 55), off, -off * 0.35],
    ];

    c.globalCompositeOperation = 'lighter';
    for (const [cc, dx, dy] of channels) {
      c.fillStyle = rgba(cc, 0.7);
      c.beginPath();
      c.arc(p.x + dx, p.y + dy, r, 0, TAU);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';

    if (s.hold > 0) {
      // Torn scanline across the shape while a glitch burst is active.
      c.fillStyle = rgba(col, 0.8);
      const y = p.y + (rnd() - 0.5) * r * 2;
      c.fillRect(p.x - r * 1.8, y, r * 3.6, 1.5 * scale);
    }
  },
};

export const circuitTrace: CursorStyle<{ seeds: number[]; phase: number }> = {
  id: 'circuit-trace',
  name: 'Circuit Trace',
  category: 'tech',
  blurb: 'Right-angled traces that route outward from the point and pad out at the end.',
  state: () => ({ seeds: Array.from({ length: 6 }, (_, i) => i * 1.7), phase: 0 }),
  draw({ c, p, col, col2, scale, dt, t }, s) {
    s.phase += dt * 0.55;
    const r = 22 * scale * (1 + p.hoverAmt * 0.4);

    c.lineWidth = 1.2 * scale;
    for (let i = 0; i < s.seeds.length; i++) {
      // Each trace runs one axis first, then the other — the Manhattan routing
      // that makes it read as a board rather than a starburst.
      const a = (i / s.seeds.length) * TAU + s.phase * 0.3;
      const grow = (Math.sin(t * 1.4 + s.seeds[i]) * 0.5 + 0.5) * 0.55 + 0.45;
      const dx = Math.cos(a) * r * grow;
      const dy = Math.sin(a) * r * grow;
      const horizontalFirst = Math.abs(dx) > Math.abs(dy);
      const kx = p.x + (horizontalFirst ? dx : 0);
      const ky = p.y + (horizontalFirst ? 0 : dy);

      c.strokeStyle = rgba(col2, 0.5 * grow);
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(kx, ky);
      c.lineTo(p.x + dx, p.y + dy);
      c.stroke();

      c.fillStyle = rgba(col2, 0.75 * grow);
      c.beginPath();
      c.arc(p.x + dx, p.y + dy, 1.8 * scale, 0, TAU);
      c.fill();
    }

    const q = 4.5 * scale * (1 - p.press * 0.2);
    c.fillStyle = rgba(col, 0.98);
    c.fillRect(p.x - q, p.y - q, q * 2, q * 2);
  },
};

export const matrixRain: CursorStyle<{ cols: Array<{ x: number; y: number; sp: number; ch: number }> }> = {
  id: 'matrix-rain',
  name: 'Rain',
  category: 'tech',
  blurb: 'Glyphs falling in narrow columns around the pointer, brightest at the head.',
  state: () => ({
    cols: Array.from({ length: 7 }, (_, i) => ({
      x: (i - 3) * 9,
      y: Math.random() * 40 - 20,
      sp: 40 + Math.random() * 90,
      ch: Math.floor(Math.random() * 10),
    })),
  }),
  draw({ c, p, col, col2, scale, dt, rnd, calm }, s) {
    const fs = 9 * scale;
    c.font = `${fs}px ${MONO}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    for (const col_ of s.cols) {
      if (!calm) col_.y += col_.sp * dt;
      if (col_.y > 34) {
        col_.y = -34;
        col_.ch = Math.floor(rnd() * 10);
      }
      for (let j = 0; j < 4; j++) {
        const y = p.y + (col_.y - j * fs * 1.15) * scale;
        const a = (1 - j / 4) * 0.85 * clamp(1 - Math.abs(col_.y) / 40, 0.1, 1);
        c.fillStyle = rgba(j === 0 ? col2 : col, a);
        c.fillText(String((col_.ch + j) % 10), p.x + col_.x * scale, y);
      }
    }

    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(p.x, p.y, 2.6 * scale, 0, TAU);
    c.fill();
  },
};

export const techStyles = [
  scanRing,
  radarPing,
  targetingSystem,
  hudBracket,
  dataCursor,
  glitchCursor,
  circuitTrace,
  matrixRain,
];
