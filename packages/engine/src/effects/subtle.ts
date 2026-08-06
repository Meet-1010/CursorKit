import { TAU, easeOutCubic, easeOutQuint, lerp, rgba } from '@ck/math';
import type { ClickEffect, EffectInstance } from '../core/types';

/**
 * Subtle family — acknowledgement, not spectacle.
 *
 * Everything here is under half a second and low contrast. These exist for
 * products where a click is a routine act and the feedback should confirm it
 * without asking to be admired.
 */

export const fadeRing: ClickEffect = {
  id: 'fade-ring',
  name: 'Fade Ring',
  family: 'subtle',
  blurb: 'A whisper of a ring. Barely there, and that is the point.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.4, k: 0 }),
  draw({ c, col, scale }, e) {
    c.strokeStyle = rgba(col, (1 - e.k) * 0.4);
    c.lineWidth = 1 * scale;
    c.beginPath();
    c.arc(e.x, e.y, lerp(8, 26, easeOutCubic(e.k)) * scale, 0, TAU);
    c.stroke();
  },
};

export const dotPop: ClickEffect = {
  id: 'dot-pop',
  name: 'Dot Pop',
  family: 'subtle',
  blurb: 'One dot that swells and vanishes. The quietest confirmation there is.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.32, k: 0 }),
  draw({ c, col, scale }, e) {
    // Rise fast, fall slow: the shape of a tap being registered.
    const grow = Math.sin(Math.min(e.k * 1.15, 1) * Math.PI);
    c.fillStyle = rgba(col, grow * 0.75);
    c.beginPath();
    c.arc(e.x, e.y, 11 * scale * grow, 0, TAU);
    c.fill();
  },
};

export const flash: ClickEffect = {
  id: 'flash',
  name: 'Flash',
  family: 'subtle',
  blurb: 'A soft bloom of light at the click point, gone in a fifth of a second.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.24, k: 0 }),
  draw({ c, col, scale }, e) {
    const r = 30 * scale;
    const a = Math.pow(1 - e.k, 2.4);
    const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
    g.addColorStop(0, rgba({ r: 255, g: 255, b: 255 }, a * 0.85));
    g.addColorStop(0.35, rgba(col, a * 0.5));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    c.fill();
  },
};

export const ghostClick: ClickEffect = {
  id: 'ghost-click',
  name: 'Ghost',
  family: 'subtle',
  blurb: 'A crosshair left behind at the click point, marking where you were.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.7, k: 0 }),
  draw({ c, col, scale }, e) {
    const a = Math.pow(1 - e.k, 1.8) * 0.6;
    const arm = lerp(3, 9, easeOutQuint(e.k)) * scale;
    const x = Math.round(e.x) + 0.5;
    const y = Math.round(e.y) + 0.5;
    c.strokeStyle = rgba(col, a);
    c.lineWidth = 1 * scale;
    c.lineCap = 'butt';
    c.beginPath();
    c.moveTo(x - arm, y);
    c.lineTo(x + arm, y);
    c.moveTo(x, y - arm);
    c.lineTo(x, y + arm);
    c.stroke();
    c.lineCap = 'round';
  },
};

export const breath: ClickEffect = {
  id: 'breath',
  name: 'Breath',
  family: 'subtle',
  blurb: 'A single ring drawing one slow breath in and out.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.55, k: 0 }),
  draw({ c, col, scale }, e) {
    const s = Math.sin(e.k * Math.PI);
    c.strokeStyle = rgba(col, s * 0.55);
    c.lineWidth = lerp(3, 1, e.k) * scale;
    c.beginPath();
    c.arc(e.x, e.y, (10 + s * 9) * scale, 0, TAU);
    c.stroke();
  },
};

export const crosshairLock: ClickEffect = {
  id: 'crosshair-lock',
  name: 'Lock',
  family: 'subtle',
  blurb: 'Four ticks converging on the point, then holding for a beat.',
  spawn: (_ctx, x, y) => ({ x, y, age: 0, life: 0.5, k: 0 }),
  draw({ c, col, scale }, e) {
    const close = easeOutQuint(Math.min(e.k * 1.8, 1));
    const d = lerp(24, 7, close) * scale;
    const len = 6 * scale;
    const a = (1 - Math.pow(e.k, 3)) * 0.9;
    c.strokeStyle = rgba(col, a);
    c.lineWidth = 1.4 * scale;
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * TAU;
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);
      c.moveTo(e.x + dx * (d + len), e.y + dy * (d + len));
      c.lineTo(e.x + dx * d, e.y + dy * d);
    }
    c.stroke();
  },
};

export const subtleEffects = [fadeRing, dotPop, flash, ghostClick, breath, crosshairLock];

export type { EffectInstance };
