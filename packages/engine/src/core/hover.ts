import type { HoverKind } from './types';

/**
 * Works out what the pointer is over, so styles can react to page structure
 * without every site author annotating their markup.
 *
 * Resolution order, most specific first:
 *   1. `data-cursor="..."` on the element or any ancestor  → explicit control
 *   2. semantic tag / role                                 → sensible default
 *   3. nothing                                             → 'none'
 */

const KINDS = new Set<string>(['none', 'link', 'button', 'image', 'text', 'custom', 'native']);

/** Longest label the cursor will carry before truncating. */
const LABEL_MAX = 28;

/**
 * Works out what to write next to the cursor, without the author annotating
 * anything.
 *
 * The order mirrors how a screen reader computes an accessible name, which is
 * the right precedence for the same reason: it is what the element actually
 * announces itself as. `data-cursor-label` stays first so an author can always
 * override, and a tag-based noun is the last resort so a label transform never
 * comes up empty over something interactive.
 */
function autoLabel(el: HTMLElement, kind: HoverKind): string | null {
  const explicit = el.dataset?.cursorLabel;
  if (explicit) return clip(explicit);

  const aria = el.getAttribute('aria-label');
  if (aria) return clip(aria);

  // aria-labelledby points at other elements; resolve and join them.
  const by = el.getAttribute('aria-labelledby');
  if (by) {
    const text = by
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent || '')
      .join(' ')
      .trim();
    if (text) return clip(text);
  }

  const title = el.getAttribute('title');
  if (title) return clip(title);

  const alt = el.getAttribute('alt') || el.querySelector('img')?.getAttribute('alt');
  if (alt) return clip(alt);

  const placeholder = (el as HTMLInputElement).placeholder;
  if (placeholder) return clip(placeholder);

  const value = (el as HTMLInputElement).value;
  if (value && (el as HTMLInputElement).type === 'submit') return clip(value);

  // `innerText` respects visibility, so it will not pick up an off-screen
  // "skip to content" or a visually-hidden helper span the way textContent would.
  const own = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  if (own) return clip(own);

  // Nothing readable — fall back to what the element is.
  return kind === 'link'
    ? 'Link'
    : kind === 'button'
      ? 'Button'
      : kind === 'image'
        ? 'View'
        : kind === 'text'
          ? 'Type'
          : null;
}

/** Truncates on a word boundary where possible, so labels never cut mid-word. */
function clip(raw: string): string {
  const s = raw.replace(/\s+/g, ' ').trim();
  if (s.length <= LABEL_MAX) return s;
  const cut = s.slice(0, LABEL_MAX);
  const space = cut.lastIndexOf(' ');
  return (space > LABEL_MAX * 0.6 ? cut.slice(0, space) : cut).trimEnd() + '…';
}

export interface HoverHit {
  kind: HoverKind;
  el: Element | null;
  label: string | null;
  color: string | null;
}

const MISS: HoverHit = { kind: 'none', el: null, label: null, color: null };

export function classify(target: Element | null, ignore: string): HoverHit {
  if (!target) return MISS;

  if (ignore) {
    try {
      if (target.closest(ignore)) return { kind: 'native', el: null, label: null, color: null };
    } catch {
      /* an invalid `ignore` selector should not take the cursor down */
    }
  }

  const tagged = target.closest('[data-cursor]') as HTMLElement | null;
  if (tagged) {
    const raw = (tagged.dataset.cursor || '').trim();
    // Any unrecognised value is a custom marker — the author is signalling
    // "treat this as special" and styles read the raw string off the element.
    const kind: HoverKind = KINDS.has(raw) ? (raw as HoverKind) : 'custom';
    return {
      kind,
      el: tagged,
      // A custom marker doubles as its own label when nothing better exists:
      // `data-cursor="Read more"` should just work.
      label:
        kind === 'native' ? null : autoLabel(tagged, kind) || (kind === 'custom' ? clip(raw) : null),
      color: tagged.dataset.cursorColor || null,
    };
  }

  const el = target.closest(
    'a[href],button,input,textarea,select,summary,label,img,video,[role="button"],[role="link"],[contenteditable="true"]',
  ) as HTMLElement | null;
  if (!el) return MISS;

  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role');
  let kind: HoverKind = 'none';

  if (tag === 'img' || tag === 'video') kind = 'image';
  else if (tag === 'textarea' || el.isContentEditable) kind = 'text';
  else if (tag === 'input') {
    const t = (el as HTMLInputElement).type;
    kind = t === 'button' || t === 'submit' || t === 'reset' || t === 'checkbox' || t === 'radio'
      ? 'button'
      : 'text';
  } else if (tag === 'a' || role === 'link') kind = 'link';
  else kind = 'button';

  // Disabled controls should not advertise themselves as interactive.
  if ((el as HTMLButtonElement).disabled) return MISS;

  return { kind, el, label: autoLabel(el, kind), color: null };
}

/**
 * Watches pointer movement and reports hover changes.
 *
 * Rects are re-read on a throttle rather than every frame — `getBoundingClientRect`
 * forces layout, and doing it at 120Hz on a scrolling page is the single easiest
 * way to make a cursor library feel slow.
 */
export class HoverWatcher {
  private current: Element | null = null;
  private rect: DOMRect | null = null;
  private nextRead = 0;
  private ignore: string;

  constructor(
    ignore: string,
    private onChange: (hit: HoverHit, rect: DOMRect | null) => void,
  ) {
    this.ignore = ignore;
  }

  attach(): void {
    document.addEventListener('pointerover', this.onOver as EventListener, { passive: true });
    document.addEventListener('pointerout', this.onOut as EventListener, { passive: true });
  }

  detach(): void {
    document.removeEventListener('pointerover', this.onOver as EventListener);
    document.removeEventListener('pointerout', this.onOut as EventListener);
  }

  /** Refresh the cached rect at most ~12x/second while hovering. */
  tick(t: number): DOMRect | null {
    if (this.current && t >= this.nextRead) {
      this.nextRead = t + 0.08;
      if (!this.current.isConnected) {
        this.current = null;
        this.rect = null;
        this.onChange(MISS, null);
        return null;
      }
      this.rect = this.current.getBoundingClientRect();
    }
    return this.rect;
  }

  private onOver = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    const hit = classify(e.target as Element, this.ignore);
    if (hit.el === this.current) return;
    this.current = hit.el;
    this.rect = hit.el ? hit.el.getBoundingClientRect() : null;
    this.nextRead = 0;
    this.onChange(hit, this.rect);
  };

  private onOut = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    // relatedTarget null means the pointer left the document entirely.
    if (e.relatedTarget) return;
    this.current = null;
    this.rect = null;
    this.onChange(MISS, null);
  };
}
