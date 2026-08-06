import { CATEGORY_DEFS } from './categories';
import { effectDefs } from './effects';
import { hoverTransforms } from './hover';
import { styleDefs } from './styles';
import type { BlendMode, CategoryId, FamilyId } from './core/types';

// Re-exported so the website can type its own filter state without reaching
// into the engine's internal module layout.
export type { BlendMode, CategoryId, FamilyId };

/**
 * Metadata for the website: everything needed to render the gallery and the
 * builder without the site hand-maintaining a parallel list. Derived from the
 * real definitions, so a style cannot exist in the engine and be missing from
 * the site, or vice versa.
 */

export interface StyleMeta {
  id: string;
  name: string;
  category: CategoryId;
  blurb: string;
  blend?: BlendMode;
}

export interface EffectMeta {
  id: string;
  name: string;
  family: FamilyId;
  blurb: string;
}

export interface HoverMeta {
  id: string;
  name: string;
  blurb: string;
}

export const styleMeta: StyleMeta[] = styleDefs.map((s) => ({
  id: s.id,
  name: s.name,
  category: s.category,
  blurb: s.blurb,
  blend: s.blend,
}));

export const effectMeta: EffectMeta[] = effectDefs.map((e) => ({
  id: e.id,
  name: e.name,
  family: e.family,
  blurb: e.blurb,
}));

export const hoverMeta: HoverMeta[] = hoverTransforms.map((h) => ({
  id: h.id,
  name: h.name,
  blurb: h.blurb,
}));

/**
 * Categories carry their own colour and their own ground — see `categories.ts`
 * for why that is load-bearing rather than decorative.
 */
export { CATEGORY_DEFS as CATEGORIES, categoryDef, categorySurface } from './categories';
export type { CategoryDef } from './categories';

export const FAMILIES: Array<{ id: FamilyId; name: string; note: string }> = [
  { id: 'ripple', name: 'Ripple', note: 'Expanding rings.' },
  { id: 'burst', name: 'Burst', note: 'Particles thrown from the click point.' },
  { id: 'shock', name: 'Shockwave', note: 'Impact and pressure.' },
  { id: 'ink', name: 'Ink', note: 'Blots, splashes, and washes.' },
  { id: 'digital', name: 'Digital', note: 'Signal failure as decoration.' },
  { id: 'physics', name: 'Physics', note: 'Implied force fields.' },
  { id: 'portal', name: 'Portal', note: 'Openings rather than marks.' },
  { id: 'subtle', name: 'Subtle', note: 'Acknowledgement, not spectacle.' },
  { id: 'material', name: 'Material', note: 'Glass flexes, metal rings, soft surfaces dent.' },
  { id: 'chaos', name: 'Chaos', note: 'For the maximalist and brutalist categories.' },
];

export { PALETTES, PALETTE_COUNT, paletteById, palettesFor } from './palettes';
export type { Palette, Ground } from './palettes';

/** How many styles each category holds. Derived, so it cannot drift. */
export const categoryCounts: Record<string, number> = Object.fromEntries(
  CATEGORY_DEFS.map((c) => [c.id, styleMeta.filter((s) => s.category === c.id).length]),
);

export const STYLE_COUNT = styleMeta.length;
export const EFFECT_COUNT = effectMeta.length;
export const HOVER_COUNT = hoverMeta.length;

/**
 * The headline number. Every style pairs with every click effect and every
 * hover transform, and each combination is a distinct, working cursor.
 */
export const COMBINATIONS = STYLE_COUNT * EFFECT_COUNT * HOVER_COUNT;
