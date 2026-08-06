import {
  HALF_PI,
  TAU,
  type Lag,
  follow,
  newLag,
  ngon,
  rgba,
} from '@ck/math';
import type { CursorStyle } from '../core/types';

/**
 * Geometric styles — editorial, architectural, built from straight lines and
 * regular polygons. Several are direction-aware: they read `p.angle`, which the
 * pointer tracker only updates while actually moving, so they hold their last
 * heading instead of spinning when you stop.
 */

export const diamond: CursorStyle<Lag> = {
  id: 'diamond',
  name: 'Diamond',
  category: 'geometric',
  blurb: 'A filled square on its point, easing a quarter turn as you press.',
  state: newLag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 18, dt);
    const r = 11 * scale * (1 + p.hoverAmt * 0.6 - p.press * 0.15);
    c.save();
    c.translate(s.x, s.y);
    c.rotate(HALF_PI * 0.5 + p.press * HALF_PI * 0.5);
    c.fillStyle = rgba(col, 0.95);
    c.fillRect(-r * 0.72, -r * 0.72, r * 1.44, r * 1.44);
    c.restore();
  },
};

export const diamondOutline: CursorStyle<Lag & { spin: number }> = {
  id: 'diamond-outline',
  name: 'Diamond Outline',
  category: 'geometric',
  blurb: 'The hollow twin — a slow rotation that speeds up over live elements.',
  state: () => ({ ...newLag(), spin: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 15, dt);
    s.spin += dt * (0.35 + p.hoverAmt * 2.2);
    const r = 13 * scale * (1 + p.hoverAmt * 0.5);
    c.save();
    c.translate(s.x, s.y);
    c.rotate(HALF_PI * 0.5 + s.spin);
    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 1.5 * scale;
    c.strokeRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
    c.restore();

    c.fillStyle = rgba(col, 0.9);
    c.beginPath();
    c.arc(p.x, p.y, 1.6 * scale, 0, TAU);
    c.fill();
  },
};

export const trianglePoint: CursorStyle = {
  id: 'triangle-point',
  name: 'Vector',
  category: 'geometric',
  blurb: 'A triangle that turns to face the direction of travel and stretches with speed.',
  draw({ c, p, col, scale }) {
    // Stretch along the axis of motion, capped so fast flicks stay legible.
    const stretch = 1 + Math.min(p.speed / 2600, 0.75);
    const r = 12 * scale * (1 + p.hoverAmt * 0.45);
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle);
    c.scale(stretch, 1 / Math.sqrt(stretch));
    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.moveTo(r, 0);
    c.lineTo(-r * 0.62, -r * 0.6);
    c.lineTo(-r * 0.3, 0);
    c.lineTo(-r * 0.62, r * 0.6);
    c.closePath();
    c.fill();
    c.restore();
  },
};

export const hexagon: CursorStyle<Lag & { spin: number }> = {
  id: 'hexagon',
  name: 'Hexagon',
  category: 'geometric',
  blurb: 'Six clean sides with a concentric core that contracts under the click.',
  state: () => ({ ...newLag(), spin: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 16, dt);
    s.spin += dt * (0.25 + p.hoverAmt * 1.6);
    const r = 14 * scale * (1 + p.hoverAmt * 0.55);

    c.strokeStyle = rgba(col, 0.92);
    c.lineWidth = 1.5 * scale;
    ngon(c, s.x, s.y, r, 6, s.spin - HALF_PI);
    c.stroke();

    c.fillStyle = rgba(col, 0.85);
    ngon(c, p.x, p.y, r * (0.3 - p.press * 0.12), 6, -s.spin - HALF_PI);
    c.fill();
  },
};

export const octagon: CursorStyle<Lag> = {
  id: 'octagon',
  name: 'Octagon',
  category: 'geometric',
  blurb: 'Eight sides, double-struck — an outline shadowed by a hairline offset.',
  state: newLag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 19, dt);
    const r = 13 * scale * (1 + p.hoverAmt * 0.5 - p.press * 0.12);

    c.strokeStyle = rgba(col, 0.28);
    c.lineWidth = 1 * scale;
    ngon(c, s.x + 2.5 * scale, s.y + 2.5 * scale, r, 8, -HALF_PI);
    c.stroke();

    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 1.5 * scale;
    ngon(c, s.x, s.y, r, 8, -HALF_PI);
    c.stroke();
  },
};

export const plusSign: CursorStyle = {
  id: 'plus-sign',
  name: 'Plus',
  category: 'geometric',
  blurb: 'A weighted plus that rotates into a multiplication sign on press.',
  draw({ c, p, col, scale }) {
    const arm = 11 * scale * (1 + p.hoverAmt * 0.5);
    const w = 3 * scale;
    c.save();
    c.translate(p.x, p.y);
    c.rotate((Math.PI / 4) * p.press);
    c.fillStyle = rgba(col, 0.95);
    c.fillRect(-arm, -w / 2, arm * 2, w);
    c.fillRect(-w / 2, -arm, w, arm * 2);
    c.restore();
  },
};

export const asterisk: CursorStyle<{ spin: number }> = {
  id: 'asterisk',
  name: 'Asterisk',
  category: 'geometric',
  blurb: 'Six radiating strokes, unfurling and turning as you approach a link.',
  state: () => ({ spin: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    s.spin += dt * (0.4 + p.hoverAmt * 3);
    const arms = 6;
    const len = 12 * scale * (1 + p.hoverAmt * 0.6 - p.press * 0.2);

    c.save();
    c.translate(p.x, p.y);
    c.rotate(s.spin);
    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 1.8 * scale;
    c.beginPath();
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * Math.PI;
      const dx = Math.cos(a) * len;
      const dy = Math.sin(a) * len;
      c.moveTo(-dx, -dy);
      c.lineTo(dx, dy);
    }
    c.stroke();
    c.restore();
  },
};

export const arrowMinimal: CursorStyle = {
  id: 'arrow-minimal',
  name: 'Fine Arrow',
  category: 'geometric',
  blurb: 'A hairline arrow drawn as an open chevron — an outline, never a blob.',
  draw({ c, p, col, scale }) {
    const r = 13 * scale * (1 + p.hoverAmt * 0.4);
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle);
    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 1.4 * scale;
    c.beginPath();
    c.moveTo(-r, 0);
    c.lineTo(r * 0.85, 0);
    c.moveTo(r * 0.2, -r * 0.45);
    c.lineTo(r * 0.85, 0);
    c.lineTo(r * 0.2, r * 0.45);
    c.stroke();
    c.restore();
  },
};

export const arrowBold: CursorStyle = {
  id: 'arrow-bold',
  name: 'Heavy Arrow',
  category: 'geometric',
  blurb: 'A solid directional wedge with a notched tail. Unmissable.',
  draw({ c, p, col, scale }) {
    const r = 14 * scale * (1 + p.hoverAmt * 0.35 - p.press * 0.12);
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle);
    c.fillStyle = rgba(col, 0.96);
    c.beginPath();
    c.moveTo(r, 0);
    c.lineTo(-r * 0.55, -r * 0.68);
    c.lineTo(-r * 0.22, 0);
    c.lineTo(-r * 0.55, r * 0.68);
    c.closePath();
    c.fill();
    c.restore();
  },
};

export const arrowDouble: CursorStyle = {
  id: 'arrow-double',
  name: 'Double Arrow',
  category: 'geometric',
  blurb: 'Heads at both ends — reads as "drag me" without a word of copy.',
  draw({ c, p, col, scale }) {
    const r = 15 * scale * (1 + p.hoverAmt * 0.5);
    const head = (x: number, dir: number) => {
      c.moveTo(x - 5 * scale * dir, -4.5 * scale);
      c.lineTo(x, 0);
      c.lineTo(x - 5 * scale * dir, 4.5 * scale);
    };
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle);
    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 1.6 * scale;
    c.beginPath();
    c.moveTo(-r, 0);
    c.lineTo(r, 0);
    head(r, 1);
    head(-r, -1);
    c.stroke();
    c.restore();
  },
};

export const geometricStyles = [
  diamond,
  diamondOutline,
  trianglePoint,
  hexagon,
  octagon,
  plusSign,
  asterisk,
  arrowMinimal,
  arrowBold,
  arrowDouble,
];
