import {
  TAU,
  clamp,
  closedSpline,
  damp,
  type Lag,
  follow,
  lerp,
  newLag,
  noise1,
  rgba,
} from '@ck/math';
import type { Ctx, CursorStyle } from '../core/types';

/**
 * Fluid styles — organic shapes that deform with motion.
 *
 * The shared trick: build a ring of sample points, displace each one by some
 * combination of noise and velocity, then trace it as a closed spline. Velocity
 * displacement is what sells it — a blob that only wobbles looks like a lava
 * lamp, a blob that *stretches along its direction of travel* looks alive.
 */

interface Blobby extends Lag {
  pts: number[];
  seed: number;
}

const blobState = (points: number): (() => Blobby) => () => ({
  ...newLag(),
  pts: new Array(points * 2).fill(0),
  seed: Math.random() * 100,
});

/**
 * Stretch factor and heading from current velocity, clamped so a fast flick
 * deforms the shape dramatically without turning it into a hairline.
 */
function velocityStretch(ctx: Ctx, max = 0.85): { amt: number; ax: number; ay: number } {
  const { p } = ctx;
  const amt = clamp(p.speed / 1800, 0, 1) * max;
  return { amt, ax: Math.cos(p.angle), ay: Math.sin(p.angle) };
}

export const blob: CursorStyle<Blobby> = {
  id: 'blob',
  name: 'Blob',
  category: 'fluid',
  blurb: 'A soft mass that elongates into its own direction of travel.',
  state: blobState(14),
  draw(ctx, s) {
    const { c, p, col, scale, dt, t } = ctx;
    follow(s, p.x, p.y, 13, dt);
    const { amt, ax, ay } = velocityStretch(ctx);
    const n = s.pts.length / 2;
    const base = 15 * scale * (1 + p.hoverAmt * 0.55 - p.press * 0.22);

    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const wobble = ctx.calm ? 0 : noise1(s.seed + i * 0.7 + t * 0.9) * 0.14;
      // Project each point onto the travel axis and push it outward there.
      const along = dx * ax + dy * ay;
      const r = base * (1 + wobble + amt * along * along * Math.sign(along) * 0.55);
      s.pts[i * 2] = s.x + dx * r + ax * amt * base * 0.35;
      s.pts[i * 2 + 1] = s.y + dy * r + ay * amt * base * 0.35;
    }

    c.fillStyle = rgba(col, 0.95);
    closedSpline(c, s.pts);
    c.fill();
  },
};

export const liquid: CursorStyle<Blobby & { rr: number }> = {
  id: 'liquid',
  name: 'Liquid',
  category: 'fluid',
  blurb: 'Surface tension made visible — a hollow drop rippling at its edge.',
  state: () => ({ ...blobState(18)(), rr: 0 }),
  draw(ctx, s) {
    const { c, p, col, scale, dt, t } = ctx;
    follow(s, p.x, p.y, 10, dt);
    const { amt, ax, ay } = velocityStretch(ctx, 0.7);
    s.rr = damp(s.rr, amt, 8, dt);
    const n = s.pts.length / 2;
    const base = 17 * scale * (1 + p.hoverAmt * 0.4);

    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const ripple = ctx.calm ? 0 : Math.sin(a * 5 - t * 3.4) * 0.06 * (0.3 + s.rr);
      const along = dx * ax + dy * ay;
      const r = base * (1 + ripple + s.rr * along * 0.4);
      s.pts[i * 2] = s.x + dx * r;
      s.pts[i * 2 + 1] = s.y + dy * r;
    }

    c.strokeStyle = rgba(col, 0.9);
    c.lineWidth = 1.8 * scale;
    closedSpline(c, s.pts);
    c.stroke();

    c.fillStyle = rgba(col, 0.16 + p.press * 0.3);
    c.fill();
  },
};

export const goo: CursorStyle<Blobby & { tail: Lag }> = {
  id: 'goo',
  name: 'Goo',
  category: 'fluid',
  blurb: 'Two bodies joined by a stretching bridge that snaps back when you settle.',
  state: () => ({ ...blobState(12)(), tail: newLag() }),
  draw(ctx, s) {
    const { c, p, col, scale, dt } = ctx;
    follow(s, p.x, p.y, 22, dt);
    follow(s.tail, p.x, p.y, 6.5, dt);

    const head = 11 * scale * (1 + p.hoverAmt * 0.5 - p.press * 0.2);
    const dx = s.x - s.tail.x;
    const dy = s.y - s.tail.y;
    const d = Math.hypot(dx, dy);
    // The trailing body shrinks as it is pulled away, so mass looks conserved.
    const tailR = head * clamp(1 - d / (95 * scale), 0.18, 1);

    c.fillStyle = rgba(col, 0.95);

    if (d > 1.5 && tailR > 0.5) {
      // Bridge: a quad joining the tangent points of both circles, waisted at
      // the midpoint. Cheaper and steadier than an SVG gooey filter.
      const nx = -dy / d;
      const ny = dx / d;
      const mx = (s.x + s.tail.x) / 2;
      const my = (s.y + s.tail.y) / 2;
      const waist = Math.min(head, tailR) * clamp(1 - d / (120 * scale), 0.1, 1);
      c.beginPath();
      c.moveTo(s.x + nx * head, s.y + ny * head);
      c.quadraticCurveTo(mx + nx * waist, my + ny * waist, s.tail.x + nx * tailR, s.tail.y + ny * tailR);
      c.lineTo(s.tail.x - nx * tailR, s.tail.y - ny * tailR);
      c.quadraticCurveTo(mx - nx * waist, my - ny * waist, s.x - nx * head, s.y - ny * head);
      c.closePath();
      c.fill();

      c.beginPath();
      c.arc(s.tail.x, s.tail.y, tailR, 0, TAU);
      c.fill();
    }

    c.beginPath();
    c.arc(s.x, s.y, head, 0, TAU);
    c.fill();
  },
};

export const waterDrop: CursorStyle<Lag & { tilt: number }> = {
  id: 'water-drop',
  name: 'Water Drop',
  category: 'fluid',
  blurb: 'A teardrop whose point swings around to trail behind the motion.',
  state: () => ({ ...newLag(), tilt: 0 }),
  draw(ctx, s) {
    const { c, p, col, scale, dt } = ctx;
    follow(s, p.x, p.y, 14, dt);
    const { amt } = velocityStretch(ctx, 1);
    s.tilt = damp(s.tilt, amt, 7, dt);

    const r = 12 * scale * (1 + p.hoverAmt * 0.45 - p.press * 0.15);
    const tail = r * (0.9 + s.tilt * 1.9);

    c.save();
    c.translate(s.x, s.y);
    // Point the tail *away* from travel: the drop is being dragged.
    c.rotate(p.angle + Math.PI);
    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.arc(0, 0, r, Math.PI * 0.42, Math.PI * 1.58);
    c.quadraticCurveTo(r * 0.35, -r * 0.55, tail, 0);
    c.quadraticCurveTo(r * 0.35, r * 0.55, Math.cos(Math.PI * 0.42) * r, Math.sin(Math.PI * 0.42) * r);
    c.closePath();
    c.fill();
    c.restore();
  },
};

export const inkDrop: CursorStyle<Blobby & { spread: number }> = {
  id: 'ink-drop',
  name: 'Ink Drop',
  category: 'fluid',
  blurb: 'A bloom of ink with a feathered edge that swells where it lands.',
  state: () => ({ ...blobState(16)(), spread: 0 }),
  draw(ctx, s) {
    const { c, p, col, scale, dt, t } = ctx;
    follow(s, p.x, p.y, 9, dt);
    s.spread = damp(s.spread, p.down ? 1 : 0, p.down ? 5 : 9, dt);
    const n = s.pts.length / 2;
    const base = 14 * scale * (1 + p.hoverAmt * 0.4 + s.spread * 0.45);

    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      // Two noise octaves give the ragged, absorbed-into-paper silhouette.
      const w = ctx.calm
        ? 0
        : noise1(s.seed + i * 1.3 + t * 0.4) * 0.17 + noise1(s.seed * 2 + i * 3.1) * 0.1;
      const r = base * (1 + w);
      s.pts[i * 2] = s.x + Math.cos(a) * r;
      s.pts[i * 2 + 1] = s.y + Math.sin(a) * r;
    }

    const g = c.createRadialGradient(s.x, s.y, base * 0.2, s.x, s.y, base * 1.35);
    g.addColorStop(0, rgba(col, 0.95));
    g.addColorStop(0.75, rgba(col, 0.8));
    g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    closedSpline(c, s.pts);
    c.fill();
  },
};

export const amoeba: CursorStyle<Blobby> = {
  id: 'amoeba',
  name: 'Amoeba',
  category: 'fluid',
  blurb: 'An irregular outline that breathes on its own, never quite repeating.',
  state: blobState(20),
  draw(ctx, s) {
    const { c, p, col, col2, scale, dt, t } = ctx;
    follow(s, p.x, p.y, 11, dt);
    const n = s.pts.length / 2;
    const base = 16 * scale * (1 + p.hoverAmt * 0.5 - p.press * 0.18);

    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      // Layering three incommensurate frequencies keeps the loop from reading
      // as a loop, which is the whole point of an amoeba.
      const w = ctx.calm
        ? 0
        : noise1(s.seed + i * 0.9 + t * 0.7) * 0.16 +
          noise1(s.seed + i * 2.2 - t * 0.31) * 0.09 +
          Math.sin(a * 3 + t * 1.1) * 0.05;
      const r = base * (1 + w);
      s.pts[i * 2] = s.x + Math.cos(a) * r;
      s.pts[i * 2 + 1] = s.y + Math.sin(a) * r;
    }

    closedSpline(c, s.pts);
    c.fillStyle = rgba(col, 0.2);
    c.fill();
    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 1.6 * scale;
    c.stroke();

    c.fillStyle = rgba(col2, 0.9);
    c.beginPath();
    c.arc(
      s.x + Math.cos(t * 0.8) * base * 0.22,
      s.y + Math.sin(t * 1.13) * base * 0.22,
      base * 0.15,
      0,
      TAU,
    );
    c.fill();
  },
};

export const magneticBlob: CursorStyle<Blobby & { grab: number }> = {
  id: 'magnetic-blob',
  name: 'Magnetic Blob',
  category: 'fluid',
  blurb: 'Squares itself off to the shape of whatever it is drawn toward.',
  state: () => ({ ...blobState(16)(), grab: 0 }),
  draw(ctx, s) {
    const { c, p, col, scale, dt, t } = ctx;
    follow(s, p.x, p.y, 12, dt);
    s.grab = damp(s.grab, p.hoverRect ? p.hoverAmt : 0, 10, dt);

    const n = s.pts.length / 2;
    const base = 15 * scale;
    // Blend the circle toward the hovered element's aspect ratio and size.
    let rx = base;
    let ry = base;
    if (p.hoverRect && s.grab > 0.001) {
      const r = p.hoverRect;
      rx = lerp(base, Math.min(r.width, 220) / 2 + 8, s.grab);
      ry = lerp(base, Math.min(r.height, 220) / 2 + 8, s.grab);
    }
    // Corners square up as it locks on: superellipse exponent rises with grab.
    const power = lerp(2, 5.5, s.grab);

    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const k =
        1 /
        Math.pow(
          Math.pow(Math.abs(ca), power) + Math.pow(Math.abs(sa), power),
          1 / power,
        );
      const w = ctx.calm ? 0 : noise1(s.seed + i + t * 0.8) * 0.1 * (1 - s.grab);
      s.pts[i * 2] = s.x + ca * k * rx * (1 + w);
      s.pts[i * 2 + 1] = s.y + sa * k * ry * (1 + w);
    }

    closedSpline(c, s.pts);
    c.fillStyle = rgba(col, lerp(0.95, 0.22, s.grab));
    c.fill();
    if (s.grab > 0.01) {
      c.strokeStyle = rgba(col, 0.9 * s.grab);
      c.lineWidth = 1.5 * scale;
      c.stroke();
    }
  },
};

export const fluidStyles = [blob, liquid, goo, waterDrop, inkDrop, amoeba, magneticBlob];
