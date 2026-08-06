import { TAU, clamp, lerp, rgba, roundRect } from '@ck/math';
import type { HoverTransform } from '../core/types';

/**
 * Hover transforms compose with any cursor style rather than replacing it.
 *
 * `pre` runs inside a saved canvas state immediately before the style draws,
 * so it can scale or translate the whole cursor. `post` draws on top. Keeping
 * these orthogonal to styles is what makes the combination space large without
 * every style needing to know about every hover behaviour.
 */

const LABEL_FONT =
  '500 11px ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';

export const hoverNone: HoverTransform = {
  id: 'none',
  name: 'None',
  blurb: 'The cursor ignores what it is over. Styles may still react on their own.',
};

export const hoverScale: HoverTransform = {
  id: 'scale-expand',
  name: 'Expand',
  blurb: 'The whole cursor scales up over anything interactive.',
  pre({ c, p }) {
    const k = 1 + p.hoverAmt * 0.45;
    if (k === 1) return;
    // Scale about the pointer so the cursor grows in place rather than drifting.
    c.translate(p.x, p.y);
    c.scale(k, k);
    c.translate(-p.x, -p.y);
  },
};

export const hoverShrink: HoverTransform = {
  id: 'scale-contract',
  name: 'Contract',
  blurb: 'The cursor tightens down instead of growing. Reads as focus.',
  pre({ c, p }) {
    const k = 1 - p.hoverAmt * 0.35;
    c.translate(p.x, p.y);
    c.scale(k, k);
    c.translate(-p.x, -p.y);
  },
};

export const hoverMagnet: HoverTransform = {
  id: 'magnet',
  name: 'Magnet',
  blurb: 'The cursor is drawn toward the centre of whatever it is over.',
  // Read by the pointer tracker before smoothing, so trails inherit the pull.
  magnetism: 0.28,
  pre({ c, p }) {
    const k = 1 + p.hoverAmt * 0.3;
    c.translate(p.x, p.y);
    c.scale(k, k);
    c.translate(-p.x, -p.y);
  },
};

export const hoverInvert: HoverTransform = {
  id: 'invert',
  name: 'Invert',
  blurb: 'A difference-blended disc takes over on hover, inverting what is beneath.',
  post({ c, p, scale }) {
    if (p.hoverAmt < 0.01) return;
    c.globalCompositeOperation = 'difference';
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(p.x, p.y, 26 * scale * p.hoverAmt, 0, TAU);
    c.fill();
    c.globalCompositeOperation = 'source-over';
  },
};

export const hoverLabel: HoverTransform = {
  id: 'label',
  name: 'Label',
  blurb: 'Shows the element’s `data-cursor-label` in a pill beside the cursor.',
  post({ c, p, col, scale, w }) {
    const text = p.label;
    if (!text || p.hoverAmt < 0.02) return;

    c.font = LABEL_FONT;
    c.textBaseline = 'middle';
    const tw = c.measureText(text).width;
    const padX = 9 * scale;
    const bw = tw + padX * 2;
    const bh = 22 * scale;
    // Grow from the cursor rather than fading in place.
    const k = clamp(p.hoverAmt, 0, 1);
    const flip = p.x + 18 * scale + bw > w;
    const bx = flip ? p.x - 18 * scale - bw : p.x + 18 * scale;
    const by = p.y - bh / 2;

    c.save();
    c.translate(flip ? bx + bw : bx, p.y);
    c.scale(k, k);
    c.translate(flip ? -(bx + bw) : -bx, -p.y);

    c.fillStyle = rgba(col, 0.95);
    roundRect(c, bx, by, bw, bh, bh / 2);
    c.fill();

    // Pick label ink from the pill's own luminance so it never disappears.
    const lum = (0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b) / 255;
    c.fillStyle = lum > 0.6 ? 'rgba(10,13,19,0.95)' : 'rgba(255,255,255,0.97)';
    c.textAlign = 'left';
    c.fillText(text, bx + padX, p.y + 0.5);
    c.restore();
  },
};

export const hoverOutline: HoverTransform = {
  id: 'outline',
  name: 'Outline',
  blurb: 'Traces a rounded box around the hovered element as you arrive.',
  post({ c, p, col, scale }) {
    const r = p.hoverRect;
    if (!r || p.hoverAmt < 0.01) return;
    const pad = lerp(14, 5, p.hoverAmt) * scale;
    c.strokeStyle = rgba(col, p.hoverAmt * 0.8);
    c.lineWidth = 1.3 * scale;
    roundRect(c, r.left - pad, r.top - pad, r.width + pad * 2, r.height + pad * 2, 8 * scale);
    c.stroke();
  },
};

export const hoverHide: HoverTransform = {
  id: 'hide',
  name: 'Hide',
  blurb: 'The cursor withdraws entirely, leaving the element to speak for itself.',
  pre({ c, p }) {
    // Scaling to zero is cleaner than an alpha fade: it also removes any glow
    // or gradient the style might be drawing outside its nominal radius.
    const k = Math.max(1 - p.hoverAmt, 0.0001);
    c.translate(p.x, p.y);
    c.scale(k, k);
    c.translate(-p.x, -p.y);
  },
};

