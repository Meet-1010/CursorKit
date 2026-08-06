import { type RGB, mixRGB } from '@ck/math';

/**
 * Works out what colour the page actually is underneath the cursor.
 *
 * This exists to fix the single most common way a custom cursor fails: a white
 * cursor crosses onto a white hero image and disappears. No amount of style
 * design solves that, because the style cannot know what it is over.
 *
 * The approach is `elementFromPoint` plus a walk up the ancestor chain,
 * compositing every semi-transparent background it passes until it reaches an
 * opaque one. That is deliberately *not* pixel sampling: reading actual pixels
 * would mean either `html2canvas` (enormous, slow, and wrong on half of real
 * pages) or `getDisplayMedia` (a permission prompt to move a cursor, which is
 * absurd). Computed styles are exact for the flat colours that cover most of a
 * page, and cheap enough to run continuously.
 *
 * Where it cannot know — an image, a video, a gradient, a canvas — it says so
 * via `confident`, and the engine falls back rather than guessing. Photographic
 * content is handled by the styles that care, not by pretending to average it.
 */

const WHITE: RGB = { r: 255, g: 255, b: 255 };

/** Elements whose paint we cannot read from computed style alone. */
const OPAQUE_MEDIA = /^(img|video|canvas|svg|picture|iframe|object|embed)$/i;

export interface BackdropReading {
  colour: RGB;
  /** False when the cursor is over media or a gradient we cannot resolve. */
  confident: boolean;
}

const parseCssColour = (input: string): { rgb: RGB; a: number } | null => {
  // Computed values are always `rgb(r, g, b)` or `rgba(r, g, b, a)`, so a
  // narrow parser is safe here and much faster than a general one.
  const m = /^rgba?\(([^)]+)\)$/.exec(input.trim());
  if (!m) return null;
  const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return {
    rgb: { r: parts[0], g: parts[1], b: parts[2] },
    a: parts.length > 3 ? parts[3] : 1,
  };
};

export class BackdropSampler {
  /** Last resolved colour. Styles read this every frame; sampling is throttled. */
  colour: RGB = { r: 10, g: 13, b: 19 };
  confident = true;

  private nextAt = 0;
  private lastEl: Element | null = null;
  private lastX = -999;
  private lastY = -999;

  /**
   * Re-reads the backdrop, at most every `interval` seconds and only when the
   * pointer has actually travelled.
   *
   * `elementFromPoint` and `getComputedStyle` both force style resolution. At
   * 120Hz that is the most expensive thing the engine would do, and the answer
   * changes far more slowly than the pointer moves — a throttle here is worth
   * more than any drawing optimisation elsewhere.
   */
  tick(x: number, y: number, t: number, interval = 0.1): void {
    if (t < this.nextAt) return;
    const moved = Math.abs(x - this.lastX) + Math.abs(y - this.lastY);
    if (moved < 6 && this.lastEl) return;
    this.nextAt = t + interval;
    this.lastX = x;
    this.lastY = y;

    const reading = this.read(x, y);
    this.colour = reading.colour;
    this.confident = reading.confident;
  }

  private read(x: number, y: number): BackdropReading {
    if (typeof document === 'undefined') return { colour: this.colour, confident: false };

    let el: Element | null;
    try {
      el = document.elementFromPoint(x, y);
    } catch {
      return { colour: this.colour, confident: false };
    }
    if (!el) return { colour: this.colour, confident: false };
    this.lastEl = el;

    // Layers found on the way up, nearest first, each still translucent.
    const stack: Array<{ rgb: RGB; a: number }> = [];
    let node: Element | null = el;
    let confident = true;
    let guard = 0;

    while (node && guard++ < 24) {
      const cs = getComputedStyle(node);

      // Media and gradients cannot be resolved from computed style. Treat the
      // element as an unknown and stop climbing — whatever is behind it is not
      // what the visitor sees.
      if (OPAQUE_MEDIA.test(node.tagName) || cs.backgroundImage !== 'none') {
        confident = false;
        break;
      }

      const parsed = parseCssColour(cs.backgroundColor);
      if (parsed && parsed.a > 0) {
        // Element opacity multiplies its background's contribution.
        const elementAlpha = Number(cs.opacity);
        const a = parsed.a * (Number.isFinite(elementAlpha) ? elementAlpha : 1);
        if (a >= 0.999) {
          stack.push({ rgb: parsed.rgb, a: 1 });
          break;
        }
        if (a > 0.001) stack.push({ rgb: parsed.rgb, a });
      }
      node = node.parentElement;
    }

    // Nothing opaque found: the page background is the canvas colour, which the
    // browser paints white unless the author said otherwise.
    let out: RGB = stack.length && stack[stack.length - 1].a >= 0.999
      ? stack[stack.length - 1].rgb
      : this.rootColour();

    // Composite the translucent layers back down, furthest first.
    for (let i = stack.length - 1; i >= 0; i--) {
      const layer = stack[i];
      if (layer.a >= 0.999) {
        out = layer.rgb;
        continue;
      }
      out = mixRGB(out, layer.rgb, layer.a);
    }

    return { colour: out, confident };
  }

  /** The colour the browser paints behind everything. */
  private rootColour(): RGB {
    const body = parseCssColour(getComputedStyle(document.body).backgroundColor);
    if (body && body.a >= 0.999) return body.rgb;
    const html = parseCssColour(getComputedStyle(document.documentElement).backgroundColor);
    if (html && html.a >= 0.999) return html.rgb;
    return WHITE;
  }
}
