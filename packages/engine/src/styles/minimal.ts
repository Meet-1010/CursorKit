import { TAU, type Lag, follow, lerp, newLag, rgba } from '@ck/math';
import type { CursorStyle } from '../core/types';

/**
 * Minimal styles.
 *
 * Convention across every style file: the engine has already set
 * `c.globalAlpha` to the cursor's overall visibility. Styles express their own
 * transparency through `rgba()` colours and only ever *multiply* globalAlpha,
 * never assign it.
 */

const lag = newLag;

export const dotRing: CursorStyle<Lag> = {
  id: 'dot-ring',
  name: 'Dot & Ring',
  category: 'minimal',
  blurb: 'A precise dot at the pointer, with a ring that catches up a beat later.',
  state: lag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 11, dt);
    const grow = 1 + p.hoverAmt * 0.9 - p.press * 0.25;
    const r = 15 * scale * grow;

    c.strokeStyle = rgba(col, 0.75);
    c.lineWidth = 1.25 * scale;
    c.beginPath();
    c.arc(s.x, s.y, r, 0, TAU);
    c.stroke();

    // The dot stays exactly on the pointer — the lag belongs to the ring alone,
    // so the cursor never feels imprecise even while the ring trails.
    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 3.1 * scale * (1 - p.hoverAmt * 0.45 + p.press * 0.3), 0, TAU);
    c.fill();
  },
};

export const dotRingThick: CursorStyle<Lag> = {
  id: 'dot-ring-thick',
  name: 'Dot & Ring, Heavy',
  category: 'minimal',
  blurb: 'The same idea with real weight — a confident stroke for bolder pages.',
  state: lag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 14, dt);
    const r = 17 * scale * (1 + p.hoverAmt * 0.7 - p.press * 0.2);

    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = 3 * scale;
    c.beginPath();
    c.arc(s.x, s.y, r, 0, TAU);
    c.stroke();

    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 3.6 * scale * (1 - p.hoverAmt * 0.5), 0, TAU);
    c.fill();
  },
};

export const thinCross: CursorStyle = {
  id: 'thin-cross',
  name: 'Hairline Cross',
  category: 'minimal',
  blurb: 'Surgical crosshair with a centre gap, for interfaces about precision.',
  draw({ c, p, col, scale }) {
    const arm = 13 * scale * (1 + p.hoverAmt * 0.55);
    const gap = 3.5 * scale * (1 - p.press * 0.6);
    // Half-pixel offset keeps a 1px stroke from straddling two device pixels.
    const x = Math.round(p.x) + 0.5;
    const y = Math.round(p.y) + 0.5;

    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = Math.max(1, scale);
    c.lineCap = 'butt';
    c.beginPath();
    c.moveTo(x - arm, y);
    c.lineTo(x - gap, y);
    c.moveTo(x + gap, y);
    c.lineTo(x + arm, y);
    c.moveTo(x, y - arm);
    c.lineTo(x, y - gap);
    c.moveTo(x, y + gap);
    c.lineTo(x, y + arm);
    c.stroke();
    c.lineCap = 'round';

    if (p.hoverAmt > 0.01) {
      c.strokeStyle = rgba(col, 0.35 * p.hoverAmt);
      c.beginPath();
      c.arc(x, y, arm * 0.62, 0, TAU);
      c.stroke();
    }
  },
};

export const cornerBracket: CursorStyle<Lag> = {
  id: 'corner-bracket',
  name: 'Corner Brackets',
  category: 'minimal',
  blurb: 'Four framing corners that open outward as you approach something live.',
  state: lag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 16, dt);
    const half = (10 + p.hoverAmt * 9) * scale - p.press * 2 * scale;
    const leg = half * 0.42;

    c.strokeStyle = rgba(col, 0.92);
    c.lineWidth = 1.5 * scale;
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      // Walk the corners as sign pairs rather than four copy-pasted blocks.
      const sx = i === 0 || i === 3 ? -1 : 1;
      const sy = i < 2 ? -1 : 1;
      const cx = s.x + half * sx;
      const cy = s.y + half * sy;
      c.moveTo(cx - leg * sx, cy);
      c.lineTo(cx, cy);
      c.lineTo(cx, cy - leg * sy);
    }
    c.stroke();

    c.fillStyle = rgba(col, 0.9);
    c.beginPath();
    c.arc(p.x, p.y, 1.8 * scale, 0, TAU);
    c.fill();
  },
};

export const doubleRing: CursorStyle<Lag & { spin: number }> = {
  id: 'double-ring',
  name: 'Double Ring',
  category: 'minimal',
  blurb: 'A solid inner ring inside a slow dashed orbit.',
  state: () => ({ ...lag(), spin: 0 }),
  draw({ c, p, col, scale, dt, t }, s) {
    follow(s, p.x, p.y, 12, dt);
    s.spin += dt * (0.5 + p.hoverAmt * 2.4);

    const outer = 21 * scale * (1 + p.hoverAmt * 0.5);
    c.save();
    c.translate(s.x, s.y);
    c.rotate(s.spin);
    c.strokeStyle = rgba(col, 0.55);
    c.lineWidth = 1.2 * scale;
    c.setLineDash([4 * scale, 5 * scale]);
    c.beginPath();
    c.arc(0, 0, outer, 0, TAU);
    c.stroke();
    c.restore();

    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 1.6 * scale;
    c.beginPath();
    c.arc(p.x, p.y, 8 * scale * (1 - p.press * 0.25 + Math.sin(t * 2) * 0.02), 0, TAU);
    c.stroke();
  },
};

export const pulseDot: CursorStyle<{ phase: number }> = {
  id: 'pulse-dot',
  name: 'Pulse',
  category: 'minimal',
  blurb: 'A dot breathing out soft rings, like something quietly transmitting.',
  state: () => ({ phase: 0 }),
  draw({ c, p, col, scale, dt, calm }, s) {
    s.phase = (s.phase + dt * 0.55) % 1;
    const rings = calm ? 1 : 2;

    for (let i = 0; i < rings; i++) {
      const k = (s.phase + i / rings) % 1;
      const r = lerp(5, 30, k) * scale * (1 + p.hoverAmt * 0.5);
      c.strokeStyle = rgba(col, 0.5 * (1 - k) * (1 - k));
      c.lineWidth = 1.4 * scale * (1 - k * 0.5);
      c.beginPath();
      c.arc(p.x, p.y, r, 0, TAU);
      c.stroke();
    }

    c.fillStyle = rgba(col, 1);
    c.beginPath();
    c.arc(p.x, p.y, 4.2 * scale * (1 + p.hoverAmt * 0.3 - p.press * 0.25), 0, TAU);
    c.fill();
  },
};

export const hollowCircle: CursorStyle<Lag> = {
  id: 'hollow-circle',
  name: 'Hollow',
  category: 'minimal',
  blurb: 'One ring, nothing else. The quietest thing in the library.',
  state: lag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 20, dt);
    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = 1.4 * scale;
    c.beginPath();
    c.arc(s.x, s.y, 13 * scale * (1 + p.hoverAmt * 0.85 - p.press * 0.18), 0, TAU);
    c.stroke();
  },
};

export const invertedCircle: CursorStyle<Lag> = {
  id: 'inverted-circle',
  name: 'Inversion',
  category: 'minimal',
  blend: 'difference',
  blurb: 'A disc that inverts whatever it passes over. Reads on any background.',
  state: lag,
  draw({ c, p, scale, dt }, s) {
    follow(s, p.x, p.y, 17, dt);
    // Difference blending against pure white is the inversion; the configured
    // colour would only mute the effect, so this style ignores it by design.
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(s.x, s.y, 16 * scale * (1 + p.hoverAmt * 1.1 - p.press * 0.2), 0, TAU);
    c.fill();
  },
};

export const textBeam: CursorStyle<{ blink: number }> = {
  id: 'text-beam',
  name: 'Reading Beam',
  category: 'minimal',
  blurb: 'A typographic caret for long-form pages, with serifed end caps.',
  state: () => ({ blink: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    s.blink += dt;
    const h = 15 * scale;
    const cap = 4 * scale;
    const x = Math.round(p.x) + 0.5;
    const y = p.y;
    const a = 0.55 + 0.45 * Math.abs(Math.cos(s.blink * 2.2));

    c.strokeStyle = rgba(col, a);
    c.lineWidth = 1.3 * scale;
    c.beginPath();
    c.moveTo(x, y - h);
    c.lineTo(x, y + h);
    c.moveTo(x - cap, y - h);
    c.lineTo(x + cap, y - h);
    c.moveTo(x - cap, y + h);
    c.lineTo(x + cap, y + h);
    c.stroke();
  },
};

export const minimalStyles = [
  dotRing,
  dotRingThick,
  thinCross,
  cornerBracket,
  doubleRing,
  pulseDot,
  hollowCircle,
  invertedCircle,
  textBeam,
];
