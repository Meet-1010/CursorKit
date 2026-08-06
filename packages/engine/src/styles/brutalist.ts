import {
  clamp,
  rgba,
} from '@ck/math';
import type { Ctx, CursorStyle } from '../core/types';

/**
 * Brutalist styles — show the machinery.
 *
 * The first pass at this category was thick shapes with hard shadows: a slab, a
 * circle, an X. That is brutalist *styling*, and it was interchangeable with the
 * geometric category wearing a heavier stroke. It said nothing.
 *
 * Brutalism in architecture is about honesty of construction — you see the
 * concrete, the services, the structure, because hiding them would be a lie
 * about what the building is. Applied to a cursor, the equivalent is not "make
 * it chunky". It is: **stop hiding what the cursor actually knows.** A cursor
 * knows its coordinates, the element under it, that element's tag and box and
 * dimensions, the pixel grid it is snapped to. Every other category conceals
 * that behind an animation. This one prints it.
 *
 * Rules for the family:
 *   Monospace, always. Numbers are content, not decoration.
 *   No easing anywhere. Values step; they never glide.
 *   Whole pixels only. Anti-aliasing is a softening, and softening is a lie.
 *   Black keyline on flat fill — which is why the category is previewed on
 *   paper. On a dark ground the keyline disappears and the language collapses.
 */

const INK = { r: 0, g: 0, b: 0 };
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const snap = (n: number): number => Math.round(n);

/** Hard shadow, flat fill, black keyline — in that order, never blurred. */
function slab(
  c: CanvasRenderingContext2D,
  path: (dx: number, dy: number) => void,
  fill: { r: number; g: number; b: number },
  offset: number,
  weight: number,
): void {
  c.fillStyle = rgba(INK, 1);
  path(offset, offset);
  c.fill();
  c.fillStyle = rgba(fill, 1);
  path(0, 0);
  c.fill();
  c.strokeStyle = rgba(INK, 1);
  c.lineWidth = weight;
  c.lineJoin = 'miter';
  path(0, 0);
  c.stroke();
  c.lineJoin = 'round';
}

/** Mono text in a hard-edged box. The category's only typographic device. */
function tag(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  fill: { r: number; g: number; b: number },
): void {
  const { c, scale } = ctx;
  const fs = 10 * scale;
  c.font = `600 ${fs}px ${MONO}`;
  c.textAlign = 'left';
  c.textBaseline = 'top';
  const w = c.measureText(text).width + 8 * scale;
  const h = fs + 7 * scale;
  const bx = snap(x);
  const by = snap(y);

  c.fillStyle = rgba(INK, 1);
  c.fillRect(bx + 3 * scale, by + 3 * scale, w, h);
  c.fillStyle = rgba(fill, 1);
  c.fillRect(bx, by, w, h);
  c.strokeStyle = rgba(INK, 1);
  c.lineWidth = 2 * scale;
  c.strokeRect(bx, by, w, h);
  c.fillStyle = rgba(INK, 1);
  c.fillText(text, bx + 4 * scale, by + 4 * scale);
}

export const readout: CursorStyle = {
  id: 'bru-readout',
  name: 'Readout',
  category: 'brutalist',
  blurb: 'Prints its own coordinates in a hard-edged box. No decoration at all.',
  draw(ctx) {
    const { c, p, col, scale } = ctx;
    const x = snap(p.x);
    const y = snap(p.y);

    c.strokeStyle = rgba(INK, 1);
    c.lineWidth = 3 * scale;
    c.lineCap = 'butt';
    c.beginPath();
    c.moveTo(x - 11 * scale, y);
    c.lineTo(x + 11 * scale, y);
    c.moveTo(x, y - 11 * scale);
    c.lineTo(x, y + 11 * scale);
    c.stroke();
    c.strokeStyle = rgba(col, 1);
    c.lineWidth = 1.4 * scale;
    c.stroke();
    c.lineCap = 'round';

    tag(ctx, `${x} ${y}`, x + 14 * scale, y + 10 * scale, col);
  },
};

export const inspector: CursorStyle = {
  id: 'bru-inspect',
  name: 'Inspector',
  category: 'brutalist',
  blurb: 'Boxes the element under the pointer and labels its tag and size.',
  draw(ctx) {
    const { c, p, col, scale } = ctx;
    const r = p.hoverRect;

    c.strokeStyle = rgba(INK, 1);
    c.lineWidth = 2.5 * scale;
    c.strokeRect(snap(p.x) - 5 * scale, snap(p.y) - 5 * scale, 10 * scale, 10 * scale);
    c.fillStyle = rgba(col, 1);
    c.fillRect(snap(p.x) - 3 * scale, snap(p.y) - 3 * scale, 6 * scale, 6 * scale);

    if (!r || p.hoverAmt < 0.5) return;
    // Snapped to whole pixels and drawn at full weight the instant it appears —
    // no fade, because a measurement is either taken or it is not.
    const x = snap(r.left);
    const y = snap(r.top);
    const w = snap(r.width);
    const h = snap(r.height);
    c.strokeStyle = rgba(INK, 1);
    c.lineWidth = 2 * scale;
    c.setLineDash([6 * scale, 4 * scale]);
    c.strokeRect(x, y, w, h);
    c.setLineDash([]);

    const name = (p.hoverEl?.tagName || 'EL').toLowerCase();
    tag(ctx, `${name} ${w}×${h}`, x, y - 22 * scale, col);
  },
};

export const gridCell: CursorStyle = {
  id: 'bru-grid',
  name: 'Grid',
  category: 'brutalist',
  blurb: 'Occupies one cell of a fixed grid and never anything in between.',
  draw(ctx) {
    const { c, p, col, scale } = ctx;
    const cell = 28 * scale;
    const gx = Math.floor(p.x / cell);
    const gy = Math.floor(p.y / cell);

    slab(c, (dx, dy) => {
      c.beginPath();
      c.rect(gx * cell + dx, gy * cell + dy, cell, cell);
    }, col, 5 * scale, 3 * scale);

    // The true pointer is still marked, so precision is not actually lost —
    // the grid is an honest statement about quantisation, not an obstruction.
    c.fillStyle = rgba(INK, 1);
    c.fillRect(snap(p.x) - 1.5 * scale, snap(p.y) - 1.5 * scale, 3 * scale, 3 * scale);

    tag(ctx, `${gx},${gy}`, gx * cell + cell + 6 * scale, gy * cell, col);
  },
};

export const rulerBrutal: CursorStyle = {
  id: 'bru-ruler',
  name: 'Ruler',
  category: 'brutalist',
  blurb: 'Measures from the viewport origin and prints the distance.',
  draw(ctx) {
    const { c, p, col, scale } = ctx;
    const x = snap(p.x);
    const y = snap(p.y);

    // Two hard rules back to the origin, with ticks every 100px.
    c.strokeStyle = rgba(INK, 0.85);
    c.lineWidth = 2 * scale;
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(x, y);
    c.moveTo(x, 0);
    c.lineTo(x, y);
    c.stroke();

    c.strokeStyle = rgba(col, 1);
    c.lineWidth = 1 * scale;
    c.beginPath();
    for (let t = 0; t < x; t += 100) {
      c.moveTo(t, y - 5 * scale);
      c.lineTo(t, y + 5 * scale);
    }
    for (let t = 0; t < y; t += 100) {
      c.moveTo(x - 5 * scale, t);
      c.lineTo(x + 5 * scale, t);
    }
    c.stroke();

    tag(ctx, `${x}px ${y}px`, x + 10 * scale, y + 10 * scale, col);
  },
};

export const blockCaret: CursorStyle<{ blink: number }> = {
  id: 'bru-caret',
  name: 'Block Caret',
  category: 'brutalist',
  blurb: 'A terminal block that blinks hard on and hard off. No fading.',
  state: () => ({ blink: 0 }),
  draw(ctx, s) {
    const { c, p, col, scale, dt } = ctx;
    s.blink = (s.blink + dt) % 1.06;
    // Square wave. A terminal cursor is on or it is off.
    if (s.blink > 0.53) return;
    const w = snap(12 * scale);
    const h = snap(22 * scale);
    const x = snap(p.x);
    const y = snap(p.y);
    c.fillStyle = rgba(INK, 1);
    c.fillRect(x + 4 * scale, y - h / 2 + 4 * scale, w, h);
    c.fillStyle = rgba(col, 1);
    c.fillRect(x, y - h / 2, w, h);
    c.strokeStyle = rgba(INK, 1);
    c.lineWidth = 2 * scale;
    c.strokeRect(x, y - h / 2, w, h);
  },
};

export const stateTag: CursorStyle = {
  id: 'bru-state',
  name: 'State',
  category: 'brutalist',
  blurb: 'Names what it is over — LINK, BUTTON, TEXT — in plain monospace.',
  draw(ctx) {
    const { c, p, col, scale } = ctx;
    const x = snap(p.x);
    const y = snap(p.y);

    slab(c, (dx, dy) => {
      c.beginPath();
      c.rect(x - 7 * scale + dx, y - 7 * scale + dy, 14 * scale, 14 * scale);
    }, col, 4 * scale, 2.5 * scale);

    const label = p.hover === 'none' ? null : p.hover.toUpperCase();
    if (label) tag(ctx, label, x + 14 * scale, y + 8 * scale, col);
  },
};

export const pixelBlock: CursorStyle = {
  id: 'bru-pixel',
  name: 'Pixel',
  category: 'brutalist',
  blurb: 'One enormous pixel on a visible grid. The medium, stated plainly.',
  draw(ctx) {
    const { c, p, col, scale } = ctx;
    const cell = 9 * scale;
    const gx = Math.floor(p.x / cell) * cell;
    const gy = Math.floor(p.y / cell) * cell;

    // The grid the pixel lives on, drawn only nearby.
    c.strokeStyle = rgba(INK, 0.28);
    c.lineWidth = 1;
    c.beginPath();
    for (let i = -3; i <= 4; i++) {
      c.moveTo(gx + i * cell, gy - 3 * cell);
      c.lineTo(gx + i * cell, gy + 4 * cell);
      c.moveTo(gx - 3 * cell, gy + i * cell);
      c.lineTo(gx + 4 * cell, gy + i * cell);
    }
    c.stroke();

    c.fillStyle = rgba(INK, 1);
    c.fillRect(gx + 3 * scale, gy + 3 * scale, cell, cell);
    c.fillStyle = rgba(col, 1);
    c.fillRect(gx, gy, cell, cell);
    c.strokeStyle = rgba(INK, 1);
    c.lineWidth = 2 * scale;
    c.strokeRect(gx, gy, cell, cell);
  },
};

export const velocityBar: CursorStyle = {
  id: 'bru-velocity',
  name: 'Velocity',
  category: 'brutalist',
  blurb: 'A bar chart of your own pointer speed, quantised to whole steps.',
  draw(ctx) {
    const { c, p, col, scale } = ctx;
    const x = snap(p.x);
    const y = snap(p.y);
    // Eight discrete steps. No interpolation between them.
    const steps = Math.round(clamp(p.speed / 2000, 0, 1) * 8);

    c.fillStyle = rgba(INK, 1);
    c.fillRect(x - 3 * scale, y - 3 * scale, 6 * scale, 6 * scale);

    for (let i = 0; i < 8; i++) {
      const bx = x + 12 * scale + i * 7 * scale;
      const bh = (5 + i * 2.5) * scale;
      c.fillStyle = rgba(INK, 1);
      c.fillRect(bx, y - bh, 5 * scale, bh);
      if (i < steps) {
        c.fillStyle = rgba(col, 1);
        c.fillRect(bx + 1 * scale, y - bh + 1 * scale, 3 * scale, bh - 2 * scale);
      }
    }
  },
};

export const crossbox: CursorStyle = {
  id: 'bru-crossbox',
  name: 'Crossbox',
  category: 'brutalist',
  blurb: 'A registration box with full-bleed guides across the whole viewport.',
  draw(ctx) {
    const { c, p, col, scale, w, h } = ctx;
    const x = snap(p.x);
    const y = snap(p.y);

    c.strokeStyle = rgba(INK, 0.5);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, y + 0.5);
    c.lineTo(w, y + 0.5);
    c.moveTo(x + 0.5, 0);
    c.lineTo(x + 0.5, h);
    c.stroke();

    const box = snap(20 * scale);
    slab(c, (dx, dy) => {
      c.beginPath();
      c.rect(x - box / 2 + dx, y - box / 2 + dy, box, box);
    }, col, 4 * scale, 2.5 * scale);
    c.fillStyle = rgba(INK, 1);
    c.fillRect(x - 1, y - box / 2, 2, box);
    c.fillRect(x - box / 2, y - 1, box, 2);
  },
};

export const stackCounter: CursorStyle<{ clicks: number }> = {
  id: 'bru-counter',
  name: 'Counter',
  category: 'brutalist',
  blurb: 'Counts your clicks and shows the total. The cursor keeps its own state.',
  state: () => ({ clicks: 0 }),
  draw(ctx, s) {
    const { c, p, col, scale } = ctx;
    // Increment on the leading edge of the press, not while it is held.
    if (p.down && p.sinceDown < 0.05) s.clicks++;
    const x = snap(p.x);
    const y = snap(p.y);

    slab(c, (dx, dy) => {
      c.beginPath();
      c.rect(x - 8 * scale + dx, y - 8 * scale + dy, 16 * scale, 16 * scale);
    }, col, 5 * scale * (p.down ? 0.3 : 1), 3 * scale);

    tag(ctx, String(s.clicks).padStart(3, '0'), x + 16 * scale, y - 6 * scale, col);
  },
};

export const marqueeBox: CursorStyle<{ ox: number; oy: number; on: boolean }> = {
  id: 'bru-marquee',
  name: 'Marquee',
  category: 'brutalist',
  blurb: 'Drag to draw a selection rectangle, with its size printed as you go.',
  state: () => ({ ox: 0, oy: 0, on: false }),
  draw(ctx, s) {
    const { c, p, col, scale } = ctx;
    if (p.down && !s.on) {
      s.on = true;
      s.ox = p.x;
      s.oy = p.y;
    }
    if (!p.down) s.on = false;

    if (s.on) {
      const x = snap(Math.min(s.ox, p.x));
      const y = snap(Math.min(s.oy, p.y));
      const w = snap(Math.abs(p.x - s.ox));
      const h = snap(Math.abs(p.y - s.oy));
      c.fillStyle = rgba(col, 0.28);
      c.fillRect(x, y, w, h);
      c.strokeStyle = rgba(INK, 1);
      c.lineWidth = 2 * scale;
      c.strokeRect(x, y, w, h);
      if (w > 20 && h > 14) tag(ctx, `${w}×${h}`, x, y - 22 * scale, col);
    }

    c.strokeStyle = rgba(INK, 1);
    c.lineWidth = 2.5 * scale;
    c.beginPath();
    c.moveTo(snap(p.x) - 9 * scale, snap(p.y));
    c.lineTo(snap(p.x) + 9 * scale, snap(p.y));
    c.moveTo(snap(p.x), snap(p.y) - 9 * scale);
    c.lineTo(snap(p.x), snap(p.y) + 9 * scale);
    c.stroke();
  },
};

export const hexDump: CursorStyle = {
  id: 'bru-hex',
  name: 'Hex',
  category: 'brutalist',
  blurb: 'Prints the colour it is standing on as a raw hex value.',
  draw(ctx) {
    const { c, p, col, scale, backdrop, backdropKnown } = ctx;
    const x = snap(p.x);
    const y = snap(p.y);
    const hexOf = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    const text = backdropKnown
      ? `#${hexOf(backdrop.r)}${hexOf(backdrop.g)}${hexOf(backdrop.b)}`
      : '#??????';

    // Swatch of the sampled colour, keylined so it reads on any ground.
    c.fillStyle = rgba(INK, 1);
    c.fillRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    c.fillStyle = backdropKnown ? rgba(backdrop, 1) : rgba(col, 1);
    c.fillRect(x - 6 * scale, y - 6 * scale, 12 * scale, 12 * scale);

    tag(ctx, text, x + 14 * scale, y + 8 * scale, col);
  },
};

export const brutalistStyles = [
  readout,
  inspector,
  gridCell,
  rulerBrutal,
  blockCaret,
  stateTag,
  pixelBlock,
  velocityBar,
  crossbox,
  stackCounter,
  marqueeBox,
  hexDump,
];
