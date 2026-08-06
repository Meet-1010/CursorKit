import {
  TAU,
  clamp,
  closedSpline,
  damp,
  type Lag,
  follow,
  mixRGB,
  newLag,
  noise1,
  rgba,
  sparkle,
} from '@ck/math';

import type { CursorStyle } from '../core/types';

/**
 * Playful styles — characterful, illustrative, drawn rather than constructed.
 *
 * Each of these is a small piece of character animation: the ghost has a hem
 * that lags, the eye tracks where you came from, the rocket banks into turns.
 * The rule is that the personality comes from secondary motion, not from the
 * silhouette alone.
 */

export const magicWand: CursorStyle<{ trail: Array<{ x: number; y: number; a: number; r: number }> }> = {
  id: 'magic-wand',
  name: 'Wand',
  category: 'playful',
  blurb: 'A tapered wand shedding sparkles from the tip as it moves.',
  state: () => ({ trail: Array.from({ length: 24 }, () => ({ x: 0, y: 0, a: 0, r: 0 })) }),
  draw({ c, p, col, col2, scale, dt, t, rnd, calm }, s) {
    const len = 17 * scale;
    // The wand is held at a fixed rake, tip leading the direction of travel.
    const ang = p.angle - 0.6;
    const tipX = p.x + Math.cos(ang) * len;
    const tipY = p.y + Math.sin(ang) * len;

    if (!calm) {
      for (const q of s.trail) {
        if (q.a <= 0) {
          if (rnd() < 0.14) {
            q.x = tipX + (rnd() - 0.5) * 6 * scale;
            q.y = tipY + (rnd() - 0.5) * 6 * scale;
            q.a = 1;
            q.r = (2 + rnd() * 4) * scale;
          }
          continue;
        }
        q.a -= dt * 1.5;
        q.y += 22 * dt;
        c.fillStyle = rgba(col2, clamp(q.a, 0, 1) * 0.9);
        sparkle(c, q.x, q.y, q.r * clamp(q.a, 0, 1), t);
        c.fill();
      }
    }

    c.save();
    c.translate(p.x, p.y);
    c.rotate(ang);
    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 2.4 * scale;
    c.beginPath();
    c.moveTo(-len * 0.55, 0);
    c.lineTo(len * 0.8, 0);
    c.stroke();
    c.restore();

    c.fillStyle = rgba(col2, 1);
    sparkle(c, tipX, tipY, 7 * scale * (1 + p.hoverAmt * 0.4 - p.press * 0.2), t * 1.2);
    c.fill();
  },
};

export const ghost: CursorStyle<Lag & { hem: number[]; bob: number }> = {
  id: 'ghost',
  name: 'Ghost',
  category: 'playful',
  blurb: 'A friendly spectre whose hem ripples a beat behind the rest of it.',
  state: () => ({ ...newLag(), hem: new Array(14).fill(0), bob: 0 }),
  draw({ c, p, col, scale, dt, t, calm }, s) {
    follow(s, p.x, p.y, 10, dt);
    s.bob += dt;
    const r = 12 * scale * (1 + p.hoverAmt * 0.3 - p.press * 0.12);
    const y = s.y + (calm ? 0 : Math.sin(s.bob * 2.4) * 1.8 * scale);

    // Body: a dome closed off by a wavy hem, traced as one path.
    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(s.x, y, r, Math.PI, 0);
    const n = s.hem.length;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const hx = s.x + r - k * r * 2;
      const wob = calm ? 0 : Math.sin(k * Math.PI * 3 - t * 5) * 2.6 * scale;
      c.lineTo(hx, y + r * 0.95 + wob);
    }
    c.closePath();
    c.fill();

    // Eyes look toward travel, so it always seems to be going somewhere.
    const lx = Math.cos(p.angle) * r * 0.16;
    const ly = Math.sin(p.angle) * r * 0.16;
    c.fillStyle = rgba({ r: 12, g: 14, b: 20 }, 0.9);
    for (const sx of [-1, 1]) {
      c.beginPath();
      c.ellipse(
        s.x + sx * r * 0.36 + lx,
        y - r * 0.18 + ly,
        r * 0.13,
        r * 0.18 * (1 - p.press * 0.7),
        0,
        0,
        TAU,
      );
      c.fill();
    }
  },
};

export const eye: CursorStyle<Lag & { blink: number; next: number }> = {
  id: 'eye',
  name: 'Eye',
  category: 'playful',
  blurb: 'An eye that looks back along your path, and blinks when you stop moving.',
  state: () => ({ ...newLag(), blink: 0, next: 2 }),
  draw({ c, p, col, col2, scale, dt, rnd }, s) {
    follow(s, p.x, p.y, 16, dt);
    s.next -= dt;
    if (s.next <= 0) {
      s.blink = 1;
      s.next = 2.2 + rnd() * 3;
    }
    s.blink = Math.max(0, s.blink - dt * 6);

    const w = 17 * scale * (1 + p.hoverAmt * 0.35);
    const h = w * 0.62 * (1 - s.blink * 0.94);

    c.fillStyle = rgba({ r: 250, g: 250, b: 252 }, 0.97);
    c.beginPath();
    c.ellipse(s.x, s.y, w, Math.max(h, 0.6), 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = 1.6 * scale;
    c.stroke();

    if (s.blink < 0.5) {
      // The iris chases the pointer inside the eye, so it lags into position
      // and gives the whole thing a sense of attention.
      const dx = clamp((p.x - s.x) * 0.5, -w * 0.42, w * 0.42);
      const dy = clamp((p.y - s.y) * 0.5, -h * 0.42, h * 0.42);
      c.fillStyle = rgba(col, 0.95);
      c.beginPath();
      c.arc(s.x + dx, s.y + dy, h * 0.62, 0, TAU);
      c.fill();
      c.fillStyle = rgba({ r: 10, g: 12, b: 18 }, 0.92);
      c.beginPath();
      c.arc(s.x + dx, s.y + dy, h * 0.3 * (1 - p.press * 0.35), 0, TAU);
      c.fill();
      c.fillStyle = rgba(col2, 0.85);
      c.beginPath();
      c.arc(s.x + dx - h * 0.22, s.y + dy - h * 0.24, h * 0.13, 0, TAU);
      c.fill();
    }
  },
};

export const fire: CursorStyle<{ pts: number[]; seed: number }> = {
  id: 'fire',
  name: 'Flame',
  category: 'playful',
  blurb: 'A licking flame with a hot core, leaning away from your direction of travel.',
  state: () => ({ pts: new Array(28).fill(0), seed: Math.random() * 90 }),
  draw({ c, p, col, col2, scale, t, calm }, s) {
    const h = 24 * scale * (1 + p.hoverAmt * 0.3 - p.press * 0.15);
    const w = 9 * scale;
    // Lean: the flame trails behind horizontal motion like a candle in a draught.
    const lean = clamp(-p.vx / 900, -1.1, 1.1);

    const body = (scaleF: number, colour: { r: number; g: number; b: number }, alpha: number) => {
      const n = s.pts.length / 2;
      for (let i = 0; i < n; i++) {
        const k = i / n;
        const a = k * TAU;
        // Tall teardrop: wide at the base, pinched to a licking tip.
        const up = -Math.cos(a) * 0.5 + 0.5;
        const flick = calm ? 0 : noise1(s.seed + i * 0.8 + t * 3.4) * 0.22 * up;
        const rx = Math.sin(a) * w * scaleF * (1 - up * 0.55) * (1 + flick);
        const ry = -up * h * scaleF * (1 + flick * 0.6);
        s.pts[i * 2] = p.x + rx + lean * up * h * 0.42;
        s.pts[i * 2 + 1] = p.y + ry + h * 0.22;
      }
      closedSpline(c, s.pts);
      c.fillStyle = rgba(colour, alpha);
      c.fill();
    };

    c.globalCompositeOperation = 'lighter';
    body(1, col, 0.5);
    body(0.62, mixRGB(col, col2, 0.5), 0.6);
    body(0.3, { r: 255, g: 248, b: 226 }, 0.85);
    c.globalCompositeOperation = 'source-over';
  },
};

export const rocket: CursorStyle<{ bank: number; puff: number }> = {
  id: 'rocket',
  name: 'Rocket',
  category: 'playful',
  blurb: 'Points where it is going, banks into turns, and throttles up with speed.',
  state: () => ({ bank: 0, puff: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    const thrust = clamp(p.speed / 1400, 0, 1);
    s.bank = damp(s.bank, thrust, 8, dt);
    s.puff += dt * (4 + thrust * 12);
    const r = 13 * scale;

    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle + Math.PI / 2);

    // Exhaust first, so the body draws over its root.
    const flame = (0.4 + s.bank) * r * (0.9 + Math.sin(s.puff) * 0.16);
    const g = c.createLinearGradient(0, r * 0.7, 0, r * 0.7 + flame);
    g.addColorStop(0, rgba({ r: 255, g: 250, b: 232 }, 0.95));
    g.addColorStop(0.4, rgba(col2, 0.75));
    g.addColorStop(1, rgba(col2, 0));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-r * 0.3, r * 0.7);
    c.quadraticCurveTo(0, r * 0.7 + flame * 1.5, r * 0.3, r * 0.7);
    c.closePath();
    c.fill();

    c.fillStyle = rgba(col, 0.96);
    c.beginPath();
    c.moveTo(0, -r);
    c.quadraticCurveTo(r * 0.55, -r * 0.1, r * 0.42, r * 0.72);
    c.lineTo(-r * 0.42, r * 0.72);
    c.quadraticCurveTo(-r * 0.55, -r * 0.1, 0, -r);
    c.fill();

    // Fins
    c.fillStyle = rgba(col2, 0.9);
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(side * r * 0.4, r * 0.24);
      c.lineTo(side * r * 0.82, r * 0.82);
      c.lineTo(side * r * 0.4, r * 0.72);
      c.closePath();
      c.fill();
    }

    c.fillStyle = rgba({ r: 14, g: 16, b: 24 }, 0.8);
    c.beginPath();
    c.arc(0, -r * 0.28, r * 0.2, 0, TAU);
    c.fill();
    c.restore();
  },
};

export const pencil: CursorStyle = {
  id: 'pencil',
  name: 'Pencil',
  category: 'playful',
  blurb: 'A sharpened pencil held at a natural rake, tip exactly on the point.',
  draw({ c, p, col, col2, scale }) {
    const L = 26 * scale;
    c.save();
    // Tip sits on the pointer; the body extends up and back at a drawing angle.
    c.translate(p.x, p.y);
    c.rotate(-Math.PI * 0.75 + p.press * 0.12);

    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(3.4 * scale, 7 * scale);
    c.lineTo(-3.4 * scale, 7 * scale);
    c.closePath();
    c.fill();

    c.fillStyle = rgba({ r: 24, g: 26, b: 34 }, 0.95);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(1.5 * scale, 3.2 * scale);
    c.lineTo(-1.5 * scale, 3.2 * scale);
    c.closePath();
    c.fill();

    c.fillStyle = rgba(col, 0.92);
    c.fillRect(-3.4 * scale, 7 * scale, 6.8 * scale, L - 7 * scale);
    c.fillStyle = rgba(col2, 0.95);
    c.fillRect(-3.4 * scale, L - 5 * scale, 6.8 * scale, 5 * scale);
    c.restore();
  },
};

export const heartBeat: CursorStyle<{ beat: number }> = {
  id: 'heart-beat',
  name: 'Heart',
  category: 'playful',
  blurb: 'A heart on a two-stage pulse, the way a real one actually beats.',
  state: () => ({ beat: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    s.beat = (s.beat + dt * 0.85) % 1;
    // lub-dub: a big beat, a small one, then rest.
    const pulse =
      Math.exp(-Math.pow((s.beat - 0.05) * 14, 2)) * 0.18 +
      Math.exp(-Math.pow((s.beat - 0.22) * 16, 2)) * 0.1;
    const r = 12 * scale * (1 + pulse + p.hoverAmt * 0.3 - p.press * 0.15);

    c.save();
    c.translate(p.x, p.y + r * 0.12);
    c.fillStyle = rgba(col, 0.96);
    c.beginPath();
    c.moveTo(0, r * 0.85);
    c.bezierCurveTo(-r * 1.35, -r * 0.15, -r * 0.55, -r * 1.05, 0, -r * 0.38);
    c.bezierCurveTo(r * 0.55, -r * 1.05, r * 1.35, -r * 0.15, 0, r * 0.85);
    c.fill();
    c.restore();
  },
};

export const balloon: CursorStyle<Lag & { sway: number }> = {
  id: 'balloon',
  name: 'Balloon',
  category: 'playful',
  blurb: 'Floats above the pointer on a slack string, swinging when you change direction.',
  state: () => ({ ...newLag(), sway: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    // The balloon lags and rides above; the string connects it back to the point.
    follow(s, p.x, p.y - 34 * scale, 7, dt);
    s.sway = damp(s.sway, clamp(-p.vx / 700, -1, 1), 5, dt);

    const r = 12 * scale * (1 + p.hoverAmt * 0.25 - p.press * 0.1);
    const bx = s.x + s.sway * 9 * scale;
    const by = s.y;

    c.strokeStyle = rgba(col2, 0.6);
    c.lineWidth = 1 * scale;
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.quadraticCurveTo((p.x + bx) / 2 - s.sway * 12 * scale, (p.y + by) / 2, bx, by + r);
    c.stroke();

    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.ellipse(bx, by, r * 0.88, r, s.sway * 0.22, 0, TAU);
    c.fill();
    c.beginPath();
    c.moveTo(bx - 2.4 * scale, by + r);
    c.lineTo(bx + 2.4 * scale, by + r);
    c.lineTo(bx, by + r + 3.4 * scale);
    c.closePath();
    c.fill();

    // Highlight sells the sphere.
    c.fillStyle = rgba({ r: 255, g: 255, b: 255 }, 0.3);
    c.beginPath();
    c.ellipse(bx - r * 0.32, by - r * 0.36, r * 0.2, r * 0.3, -0.5, 0, TAU);
    c.fill();
  },
};

export const playfulStyles = [magicWand, ghost, eye, fire, rocket, pencil, heartBeat, balloon];
