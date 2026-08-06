import {
  TAU,
  clamp,
  lerp,
  luminance,
  mixRGB,
  rgba,
  roundRect,
  star,
} from '@ck/math';
import type { HoverTransform } from '../core/types';

/**
 * Second wave of hover transforms.
 *
 * A transform composes with any of the styles rather than replacing one, so
 * everything here has to stay agnostic about what is being drawn: `pre` may
 * only change the canvas transform, and `post` may only add on top. Anything
 * that assumed a particular shape would break on 169 of them.
 *
 * Several of these read `p.label`, which the engine now derives automatically
 * from the hovered element's accessible name — so they work on ordinary markup
 * with no `data-` attributes at all.
 */

const WHITE = { r: 255, g: 255, b: 255 };
const UI_FONT = '500 11px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

/** Picks readable ink for a filled chip of the given colour. */
const inkOn = (col: { r: number; g: number; b: number }): string =>
  luminance(col) > 0.6 ? 'rgba(10,13,19,0.95)' : 'rgba(255,255,255,0.97)';

/* ------------------------------------------------------------- transforms */

export const hoverGrow: HoverTransform = {
  id: 'scale-grow',
  name: 'Grow Large',
  blurb: 'Doubles the cursor. The most obvious possible signal that something is live.',
  pre({ c, p }) {
    const k = 1 + p.hoverAmt * 1.1;
    c.translate(p.x, p.y);
    c.scale(k, k);
    c.translate(-p.x, -p.y);
  },
};

export const hoverSquash: HoverTransform = {
  id: 'squash',
  name: 'Squash',
  blurb: 'Flattens the cursor horizontally, like it is being pressed against glass.',
  pre({ c, p }) {
    c.translate(p.x, p.y);
    c.scale(1 + p.hoverAmt * 0.5, 1 - p.hoverAmt * 0.35);
    c.translate(-p.x, -p.y);
  },
};

export const hoverSpin: HoverTransform = {
  id: 'spin',
  name: 'Spin',
  blurb: 'Rotates the whole cursor a half turn as it arrives on a target.',
  pre({ c, p }) {
    c.translate(p.x, p.y);
    c.rotate(p.hoverAmt * Math.PI);
    c.translate(-p.x, -p.y);
  },
};

export const hoverTilt: HoverTransform = {
  id: 'tilt',
  name: 'Tilt',
  blurb: 'Skews the cursor as though it were lying on a surface seen at an angle.',
  pre({ c, p }) {
    const k = p.hoverAmt * 0.32;
    c.translate(p.x, p.y);
    c.transform(1, 0, -k, 1 - k * 0.4, 0, 0);
    c.translate(-p.x, -p.y);
  },
};

export const hoverJitter: HoverTransform = {
  id: 'jitter',
  name: 'Jitter',
  blurb: 'Vibrates the cursor while it sits over something clickable.',
  pre({ c, p, t, calm }) {
    if (calm) return;
    // Two incommensurate frequencies, so it buzzes rather than oscillating.
    const a = p.hoverAmt * 1.6;
    c.translate(Math.sin(t * 47) * a, Math.cos(t * 61) * a);
  },
};

export const hoverLift: HoverTransform = {
  id: 'lift',
  name: 'Lift',
  blurb: 'Raises the cursor and drops a soft shadow beneath it.',
  pre({ c, p, scale }) {
    c.translate(0, -p.hoverAmt * 5 * scale);
  },
  post({ c, p, scale }) {
    if (p.hoverAmt < 0.02) return;
    // Shadow is drawn after, at the original position, so it stays put while
    // the cursor rises away from it.
    const r = 14 * scale;
    const g = c.createRadialGradient(p.x, p.y + 4 * scale, 0, p.x, p.y + 4 * scale, r);
    g.addColorStop(0, `rgba(0,0,0,${0.3 * p.hoverAmt})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalCompositeOperation = 'destination-over';
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(p.x, p.y + 4 * scale, r, r * 0.5, 0, 0, TAU);
    c.fill();
    c.globalCompositeOperation = 'source-over';
  },
};

export const hoverRingPulse: HoverTransform = {
  id: 'ring-pulse',
  name: 'Ring Pulse',
  blurb: 'Emits a continuous ring while you rest on a target.',
  post({ c, p, col, scale, t, calm }) {
    if (p.hoverAmt < 0.02) return;
    const rings = calm ? 1 : 2;
    for (let i = 0; i < rings; i++) {
      const k = ((t * 0.9 + i / rings) % 1);
      c.strokeStyle = rgba(col, (1 - k) * 0.5 * p.hoverAmt);
      c.lineWidth = 1.5 * scale * (1 - k * 0.5);
      c.beginPath();
      c.arc(p.x, p.y, lerp(10, 42, k) * scale, 0, TAU);
      c.stroke();
    }
  },
};

export const hoverCrosshair: HoverTransform = {
  id: 'crosshair',
  name: 'Crosshair',
  blurb: 'Extends full-height and full-width guides across the viewport.',
  post({ c, p, col, w, h, scale }) {
    if (p.hoverAmt < 0.02) return;
    // Guides grow out from the pointer rather than fading in, so the eye can
    // follow where they came from.
    const reach = p.hoverAmt;
    c.strokeStyle = rgba(col, 0.28 * p.hoverAmt);
    c.lineWidth = 1 * scale;
    c.beginPath();
    c.moveTo(p.x - p.x * reach, p.y);
    c.lineTo(p.x + (w - p.x) * reach, p.y);
    c.moveTo(p.x, p.y - p.y * reach);
    c.lineTo(p.x, p.y + (h - p.y) * reach);
    c.stroke();
  },
};

export const hoverCorners: HoverTransform = {
  id: 'corners',
  name: 'Corner Marks',
  blurb: 'Puts registration corners on the element, ignoring the cursor entirely.',
  post({ c, p, col, scale }) {
    const r = p.hoverRect;
    if (!r || p.hoverAmt < 0.02) return;
    const pad = lerp(16, 6, p.hoverAmt) * scale;
    const leg = 10 * scale;
    const x0 = r.left - pad;
    const y0 = r.top - pad;
    const x1 = r.right + pad;
    const y1 = r.bottom + pad;

    c.strokeStyle = rgba(col, 0.85 * p.hoverAmt);
    c.lineWidth = 1.5 * scale;
    c.beginPath();
    for (const [x, y, sx, sy] of [
      [x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1],
    ] as const) {
      c.moveTo(x + leg * sx, y);
      c.lineTo(x, y);
      c.lineTo(x, y + leg * sy);
    }
    c.stroke();
  },
};

export const hoverUnderline: HoverTransform = {
  id: 'underline',
  name: 'Underline',
  blurb: 'Sweeps a rule along the bottom of whatever you are pointing at.',
  post({ c, p, col, scale }) {
    const r = p.hoverRect;
    if (!r || p.hoverAmt < 0.02) return;
    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = 2 * scale;
    c.beginPath();
    c.moveTo(r.left, r.bottom + 3 * scale);
    // Wipes left to right rather than fading, which reads as a deliberate mark.
    c.lineTo(r.left + r.width * p.hoverAmt, r.bottom + 3 * scale);
    c.stroke();
  },
};

export const hoverHighlight: HoverTransform = {
  id: 'highlight',
  name: 'Highlighter',
  blurb: 'Washes a translucent marker stripe over the element, like a highlighter.',
  post({ c, p, col, scale }) {
    const r = p.hoverRect;
    if (!r || p.hoverAmt < 0.02) return;
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = rgba(col, 0.3 * p.hoverAmt);
    roundRect(c, r.left - 3 * scale, r.top, r.width * p.hoverAmt + 6 * scale, r.height, 2 * scale);
    c.fill();
    c.globalCompositeOperation = 'source-over';
  },
};

export const hoverLabelChip: HoverTransform = {
  id: 'label-chip',
  name: 'Label Chip',
  blurb: 'A square-cornered chip naming the element, read from its own content.',
  post({ c, p, col, scale, w: vw }) {
    if (!p.label || p.hoverAmt < 0.02) return;
    c.font = UI_FONT;
    c.textBaseline = 'middle';
    const tw = c.measureText(p.label).width;
    const bw = tw + 16 * scale;
    const bh = 20 * scale;
    const flip = p.x + 16 * scale + bw > vw;
    const bx = flip ? p.x - 16 * scale - bw : p.x + 16 * scale;

    c.globalAlpha *= p.hoverAmt;
    c.fillStyle = rgba(col, 0.96);
    c.fillRect(bx, p.y - bh / 2, bw, bh);
    c.fillStyle = inkOn(col);
    c.textAlign = 'left';
    c.fillText(p.label, bx + 8 * scale, p.y + 0.5);
  },
};

export const hoverLabelBelow: HoverTransform = {
  id: 'label-below',
  name: 'Caption',
  blurb: 'Sets the element’s name underneath it, centred, like a photo caption.',
  post({ c, p, col, scale }) {
    const r = p.hoverRect;
    if (!p.label || !r || p.hoverAmt < 0.02) return;
    c.font = UI_FONT;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.globalAlpha *= p.hoverAmt;
    const y = r.bottom + lerp(2, 8, p.hoverAmt) * scale;
    c.fillStyle = rgba(col, 0.95);
    c.fillText(p.label, r.left + r.width / 2, y);
  },
};

export const hoverTypewriter: HoverTransform = {
  id: 'typewriter',
  name: 'Typewriter',
  blurb: 'Types the element’s name out one character at a time beside the cursor.',
  post({ c, p, col, scale, w: vw }) {
    if (!p.label || p.hoverAmt < 0.02) return;
    // Character count is driven by the eased hover amount, so it types in on
    // arrival and deletes itself on the way out.
    const n = Math.max(1, Math.round(p.label.length * clamp(p.hoverAmt * 1.3, 0, 1)));
    const shown = p.label.slice(0, n);
    c.font = '500 11px ui-monospace, Menlo, Consolas, monospace';
    c.textBaseline = 'middle';
    const tw = c.measureText(shown).width;
    const flip = p.x + 16 * scale + tw > vw;
    const bx = flip ? p.x - 16 * scale - tw : p.x + 16 * scale;
    c.textAlign = 'left';
    c.fillStyle = rgba(col, 0.95);
    c.fillText(shown, bx, p.y + 0.5);
    if (n < p.label.length) c.fillRect(bx + tw + 1, p.y - 6 * scale, 1.5 * scale, 12 * scale);
  },
};

export const hoverCount: HoverTransform = {
  id: 'readout',
  name: 'Size Readout',
  blurb: 'Prints the hovered element’s pixel dimensions, like a design tool.',
  post({ c, p, col, scale }) {
    const r = p.hoverRect;
    if (!r || p.hoverAmt < 0.02) return;
    const text = `${Math.round(r.width)} × ${Math.round(r.height)}`;
    c.font = '500 10px ui-monospace, Menlo, Consolas, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const tw = c.measureText(text).width;
    c.globalAlpha *= p.hoverAmt;
    c.fillStyle = rgba(col, 0.95);
    c.fillRect(r.left + r.width / 2 - tw / 2 - 5 * scale, r.top - 16 * scale, tw + 10 * scale, 14 * scale);
    c.fillStyle = inkOn(col);
    c.fillText(text, r.left + r.width / 2, r.top - 9 * scale);
  },
};

export const hoverDim: HoverTransform = {
  id: 'spotlight',
  name: 'Spotlight',
  blurb: 'Darkens the whole page except a circle around the pointer.',
  post({ c, p, w, h, scale }) {
    if (p.hoverAmt < 0.02) return;
    const r = 90 * scale;
    // Punch the hole with a radial gradient so the edge is soft, not a stencil.
    const g = c.createRadialGradient(p.x, p.y, r * 0.4, p.x, p.y, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${0.45 * p.hoverAmt})`);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  },
};

export const hoverTether: HoverTransform = {
  id: 'tether',
  name: 'Tether',
  blurb: 'Draws a line from the cursor to the centre of the element it is over.',
  post({ c, p, col, scale }) {
    const r = p.hoverRect;
    if (!r || p.hoverAmt < 0.02) return;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    c.strokeStyle = rgba(col, 0.5 * p.hoverAmt);
    c.lineWidth = 1 * scale;
    c.setLineDash([3 * scale, 3 * scale]);
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(cx, cy);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = rgba(col, 0.8 * p.hoverAmt);
    c.beginPath();
    c.arc(cx, cy, 2.5 * scale, 0, TAU);
    c.fill();
  },
};

export const hoverOrbit: HoverTransform = {
  id: 'orbit',
  name: 'Orbit',
  blurb: 'Sends three satellites into orbit around the cursor while it is on target.',
  post({ c, p, col, scale, t }) {
    if (p.hoverAmt < 0.02) return;
    const r = 24 * scale * p.hoverAmt;
    for (let i = 0; i < 3; i++) {
      const a = t * 2.2 + (i / 3) * TAU;
      c.fillStyle = rgba(col, 0.9 * p.hoverAmt);
      c.beginPath();
      c.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 2.4 * scale, 0, TAU);
      c.fill();
    }
  },
};

export const hoverSparkle: HoverTransform = {
  id: 'sparkle',
  name: 'Sparkle',
  blurb: 'Scatters small stars around the pointer over anything interactive.',
  post({ c, p, col, scale, t }) {
    if (p.hoverAmt < 0.02) return;
    for (let i = 0; i < 5; i++) {
      const a = t * 0.9 + (i / 5) * TAU;
      const d = (16 + Math.sin(t * 3 + i * 2) * 6) * scale * p.hoverAmt;
      const size = (2.5 + Math.sin(t * 4 + i) * 1.2) * scale;
      c.fillStyle = rgba(mixRGB(col, WHITE, 0.4), 0.9 * p.hoverAmt);
      star(c, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, size, size * 0.4, 4, a);
      c.fill();
    }
  },
};

export const hoverShadowGrow: HoverTransform = {
  id: 'hard-shadow',
  name: 'Hard Shadow',
  blurb: 'Casts a flat offset shadow behind the cursor. Pairs with brutalist styles.',
  post({ c, p, scale }) {
    if (p.hoverAmt < 0.02) return;
    const off = 6 * scale * p.hoverAmt;
    c.globalCompositeOperation = 'destination-over';
    c.fillStyle = `rgba(0,0,0,${0.85 * p.hoverAmt})`;
    c.beginPath();
    c.arc(p.x + off, p.y + off, 15 * scale, 0, TAU);
    c.fill();
    c.globalCompositeOperation = 'source-over';
  },
};

export const hoverMagnetStrong: HoverTransform = {
  id: 'magnet-strong',
  name: 'Strong Magnet',
  blurb: 'Snaps hard to the centre of the target. Almost impossible to miss a click.',
  magnetism: 0.62,
  pre({ c, p }) {
    const k = 1 + p.hoverAmt * 0.2;
    c.translate(p.x, p.y);
    c.scale(k, k);
    c.translate(-p.x, -p.y);
  },
};

export const hoverMoreTransforms = [
  hoverGrow,
  hoverSquash,
  hoverSpin,
  hoverTilt,
  hoverJitter,
  hoverLift,
  hoverRingPulse,
  hoverCrosshair,
  hoverCorners,
  hoverUnderline,
  hoverHighlight,
  hoverLabelChip,
  hoverLabelBelow,
  hoverTypewriter,
  hoverCount,
  hoverDim,
  hoverTether,
  hoverOrbit,
  hoverSparkle,
  hoverShadowGrow,
  hoverMagnetStrong,
];
