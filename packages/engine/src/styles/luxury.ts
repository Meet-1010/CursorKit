import {
  TAU,
  type Lag,
  follow,
  lerp,
  mixRGB,
  newLag,
  rgba,
} from '@ck/math';
import type { CursorStyle } from '../core/types';

/**
 * Luxury styles — fashion, editorial, and brand work.
 *
 * The whole family is about restraint: hairline weights, generous scale, slow
 * easing. Nothing here bounces. Where the other categories add motion to draw
 * attention, these subtract it.
 */

const SERIF = 'Didot,"Bodoni MT","Playfair Display",Georgia,"Times New Roman",serif';

export const thinLineCircle: CursorStyle<Lag> = {
  id: 'thin-line-circle',
  name: 'Hairline',
  category: 'luxury',
  blurb: 'A single hairline ring at generous scale. The whole style is the weight.',
  state: newLag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 7, dt);
    c.strokeStyle = rgba(col, 0.85);
    // Deliberately sub-pixel at 1x — on a retina display this is a true hairline,
    // and that fragility is the point.
    c.lineWidth = 0.75 * scale;
    c.beginPath();
    c.arc(s.x, s.y, 26 * scale * (1 + p.hoverAmt * 0.35 - p.press * 0.06), 0, TAU);
    c.stroke();
  },
};

export const editorialDot: CursorStyle<Lag> = {
  id: 'editorial-dot',
  name: 'Editorial Dot',
  category: 'luxury',
  blurb: 'An oversized filled disc that opens into a ring over anything clickable.',
  state: newLag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 9, dt);
    const r = 20 * scale * (1 + p.hoverAmt * 0.55 - p.press * 0.1);
    // Fill hollows out as hover rises: one shape, two states, no cross-fade.
    const inner = r * p.hoverAmt * 0.78;

    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(s.x, s.y, r, 0, TAU);
    if (inner > 0.5) {
      c.arc(s.x, s.y, inner, 0, TAU, true);
    }
    c.fill('evenodd');
  },
};

export const serifArrow: CursorStyle<Lag> = {
  id: 'serif-arrow',
  name: 'Serif Arrow',
  category: 'luxury',
  blurb: 'An arrow with bracketed serifs and a modulated stroke, drawn like type.',
  state: newLag,
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 14, dt);
    const r = 15 * scale * (1 + p.hoverAmt * 0.3);
    c.save();
    c.translate(s.x, s.y);
    c.rotate(p.angle);
    c.fillStyle = rgba(col, 0.95);

    // Stem with entasis — thicker at the join, tapering to the tail.
    c.beginPath();
    c.moveTo(-r, -0.5 * scale);
    c.quadraticCurveTo(0, -1.5 * scale, r * 0.4, -1.6 * scale);
    c.lineTo(r * 0.4, 1.6 * scale);
    c.quadraticCurveTo(0, 1.5 * scale, -r, 0.5 * scale);
    c.closePath();
    c.fill();

    // Bracketed head: concave flanks rather than a flat triangle.
    c.beginPath();
    c.moveTo(r, 0);
    c.quadraticCurveTo(r * 0.5, -r * 0.2, r * 0.24, -r * 0.44);
    c.lineTo(r * 0.36, 0);
    c.lineTo(r * 0.24, r * 0.44);
    c.quadraticCurveTo(r * 0.5, r * 0.2, r, 0);
    c.fill();

    // Tail serif
    c.fillRect(-r - 0.5 * scale, -3 * scale, 1.4 * scale, 6 * scale);
    c.restore();
  },
};

export const fashionCross: CursorStyle<Lag & { spin: number }> = {
  id: 'fashion-cross',
  name: 'Fashion Cross',
  category: 'luxury',
  blurb: 'Two ultra-thin strokes at full bleed, rotating a slow eighth turn on hover.',
  state: () => ({ ...newLag(), spin: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 11, dt);
    s.spin = lerp(s.spin, p.hoverAmt * (Math.PI / 4), 1 - Math.exp(-6 * dt));
    const arm = 22 * scale * (1 + p.hoverAmt * 0.2);

    c.save();
    c.translate(s.x, s.y);
    c.rotate(s.spin);
    c.strokeStyle = rgba(col, 0.8);
    c.lineWidth = 0.8 * scale;
    c.lineCap = 'butt';
    c.beginPath();
    c.moveTo(-arm, 0);
    c.lineTo(arm, 0);
    c.moveTo(0, -arm);
    c.lineTo(0, arm);
    c.stroke();
    c.lineCap = 'round';
    c.restore();
  },
};

export const goldFoil: CursorStyle<Lag & { shimmer: number }> = {
  id: 'gold-foil',
  name: 'Gold Foil',
  category: 'luxury',
  blurb: 'A metallic disc with a specular band that travels as you move.',
  state: () => ({ ...newLag(), shimmer: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    follow(s, p.x, p.y, 12, dt);
    s.shimmer += dt * 0.8 + Math.abs(p.vx + p.vy) * dt * 0.0016;
    const r = 15 * scale * (1 + p.hoverAmt * 0.5 - p.press * 0.1);

    // Metal is a gradient with a hard bright band, not a soft blur — the sharp
    // transition between light and dark is what reads as polished.
    const a = s.shimmer;
    const g = c.createLinearGradient(
      s.x - Math.cos(a) * r,
      s.y - Math.sin(a) * r,
      s.x + Math.cos(a) * r,
      s.y + Math.sin(a) * r,
    );
    const dark = mixRGB(col, { r: 20, g: 14, b: 4 }, 0.55);
    const lightC = mixRGB(col2, { r: 255, g: 252, b: 236 }, 0.7);
    g.addColorStop(0, rgba(dark, 0.95));
    g.addColorStop(0.34, rgba(col, 0.98));
    g.addColorStop(0.46, rgba(lightC, 1));
    g.addColorStop(0.56, rgba(col, 0.98));
    g.addColorStop(1, rgba(dark, 0.95));

    c.fillStyle = g;
    c.beginPath();
    c.arc(s.x, s.y, r, 0, TAU);
    c.fill();

    c.strokeStyle = rgba(lightC, 0.4);
    c.lineWidth = 0.8 * scale;
    c.stroke();
  },
};

export const monogramRing: CursorStyle<Lag & { spin: number }> = {
  id: 'monogram-ring',
  name: 'Monogram',
  category: 'luxury',
  blurb: 'A ring framing a single letter — set `data-cursor-label` to change it.',
  state: () => ({ ...newLag(), spin: 0 }),
  draw({ c, p, col, scale, dt }, s) {
    follow(s, p.x, p.y, 10, dt);
    s.spin += dt * 0.22;
    const r = 21 * scale * (1 + p.hoverAmt * 0.35 - p.press * 0.06);

    c.strokeStyle = rgba(col, 0.75);
    c.lineWidth = 0.9 * scale;
    c.beginPath();
    c.arc(s.x, s.y, r, 0, TAU);
    c.stroke();

    // Four ticks on the ring, quietly turning.
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = s.spin + (i / 4) * TAU;
      c.moveTo(s.x + Math.cos(a) * (r - 3 * scale), s.y + Math.sin(a) * (r - 3 * scale));
      c.lineTo(s.x + Math.cos(a) * (r + 3 * scale), s.y + Math.sin(a) * (r + 3 * scale));
    }
    c.stroke();

    const letter = (p.label || 'A').trim().charAt(0).toUpperCase() || 'A';
    c.font = `${17 * scale}px ${SERIF}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = rgba(col, 0.95);
    c.fillText(letter, s.x, s.y + 1 * scale);
  },
};

export const platedRing: CursorStyle<Lag & { t: number }> = {
  id: 'plated-ring',
  name: 'Plated Ring',
  category: 'luxury',
  blurb: 'Two rings on opposed springs — one leads, one trails, never quite aligned.',
  state: () => ({ ...newLag(), t: 0 }),
  draw({ c, p, col, col2, scale, dt }, s) {
    follow(s, p.x, p.y, 6, dt);
    const r = 19 * scale * (1 + p.hoverAmt * 0.4);

    c.strokeStyle = rgba(col2, 0.5);
    c.lineWidth = 0.9 * scale;
    c.beginPath();
    c.arc(s.x, s.y, r * 1.14, 0, TAU);
    c.stroke();

    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = 1.1 * scale;
    c.beginPath();
    c.arc(p.x, p.y, r * (1 - p.press * 0.08), 0, TAU);
    c.stroke();
  },
};

export const luxuryStyles = [
  thinLineCircle,
  editorialDot,
  serifArrow,
  fashionCross,
  goldFoil,
  monogramRing,
  platedRing,
];
