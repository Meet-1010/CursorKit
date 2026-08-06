import type { CategoryId } from './core/types';

/**
 * What each design language actually requires to look like itself.
 *
 * This exists because of a real failure. The six material categories were built
 * to take whatever colour the visitor picked and draw with it — which is right
 * for a dot or an arrow, and completely wrong for a design language whose whole
 * identity *is* its colour relationship.
 *
 * Neumorphism is the clearest case: it is defined by the shape being the same
 * colour as the surface it sits on, with one light shadow and one dark. Hand it
 * an amber fill on a near-black page and there is nothing for the shadows to
 * read against — it stops being neumorphism and becomes a small amber blob.
 *
 * Glass has the opposite failure. A frosted panel over a flat background blurs
 * a flat background, which looks like nothing at all. Glass can only be shown
 * over content.
 *
 * So every category declares three things:
 *
 *   `palette`  the colour relationship the language is built on
 *   `surface`  the ground it has to be demoed against, as real CSS
 *   `locked`   whether the palette is load-bearing or merely a good default
 *
 * `locked` is the important one. For a minimal dot, colour is preference. For
 * neumorphism, colour is the technique — so the builder warns before letting
 * you break it, rather than silently rendering something broken.
 */

export interface CategoryDef {
  id: CategoryId;
  name: string;
  note: string;
  /** Canonical colour pair for this design language. */
  palette: { color: string; color2: string };
  /** CSS background for previews. Gradients where the style needs content behind it. */
  surface: string;
  /** Light-theme equivalent, when the language reads differently on paper. */
  surfaceLight?: string;
  /**
   * True when the palette is part of the technique rather than a preference.
   * The builder surfaces this instead of letting the language quietly break.
   */
  locked?: boolean;
  /** Shown in the builder when `locked`, explaining what the constraint is. */
  constraint?: string;
}

export const CATEGORY_DEFS: CategoryDef[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    note: 'Dots, rings, and hairlines. Almost nothing.',
    palette: { color: 'ffffff', color2: 'c9d1de' },
    surface: '#0a0d13',
    surfaceLight: '#eef0f4',
  },
  {
    id: 'geometric',
    name: 'Geometric',
    note: 'Straight lines and regular polygons.',
    palette: { color: 'ffffff', color2: '7dd3fc' },
    surface: '#0a0d13',
    surfaceLight: '#eef0f4',
  },
  {
    id: 'fluid',
    name: 'Fluid',
    note: 'Organic shapes that deform as they move.',
    palette: { color: '6ee7d3', color2: '3b9c8f' },
    surface: 'linear-gradient(160deg, #071a1c 0%, #0a0d13 100%)',
    surfaceLight: '#eef4f2',
  },
  {
    id: 'trail',
    name: 'Trails',
    note: 'Cursors that leave a path behind them.',
    palette: { color: 'ffa132', color2: 'ff6b35' },
    surface: '#0a0d13',
    surfaceLight: '#f4f1ec',
  },
  {
    id: 'particle',
    name: 'Particles',
    note: 'Emitters — sparks, dust, smoke, light.',
    palette: { color: '35e0ff', color2: 'b04dff' },
    // Additive blending needs a genuinely dark ground or the glow washes out.
    surface: 'radial-gradient(90% 70% at 50% 50%, #10121f 0%, #05060a 100%)',
    surfaceLight: '#e8eaf2',
  },
  {
    id: 'tech',
    name: 'Tech',
    note: 'Reticles, readouts, and instrument panels.',
    palette: { color: '7dd3fc', color2: 'ffffff' },
    surface: '#070a10',
    surfaceLight: '#eef2f6',
  },
  {
    id: 'playful',
    name: 'Playful',
    note: 'Drawn characters with secondary motion.',
    palette: { color: 'ff7a6b', color2: 'ffd6a5' },
    surface: 'linear-gradient(160deg, #1a1226 0%, #0a0d13 100%)',
    surfaceLight: '#fdf6ee',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    note: 'Hairline weights and unhurried easing.',
    palette: { color: 'd4a437', color2: 'fff3c4' },
    surface: 'linear-gradient(160deg, #14110c 0%, #0a0908 100%)',
    surfaceLight: '#f5f1e8',
  },

  /* ------------------------------------------------- the material languages */
  {
    id: 'neumorphic',
    name: 'Neumorphic',
    note: 'Soft UI, extruded from the page with paired shadows.',
    // Colour is not a choice here — these read the page and deform it.
    palette: { color: 'e0e5ec', color2: 'a3b1c6' },
    surface: '#e0e5ec',
    surfaceLight: '#e0e5ec',
    locked: true,
    constraint:
      'These styles ignore the colour picker. Neumorphism only works when the shape is the same colour as the page behind it, so they read the real background under the cursor and deform that instead. The colour below is only used over images and gradients, where there is no flat surface to sample.',
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    note: 'Hard edges, flat fills, no easing at all.',
    // Neobrutalism is black keyline on saturated fill over paper. On a dark
    // ground the keyline disappears and the whole language collapses.
    palette: { color: 'ffd23f', color2: 'ff5c5c' },
    surface: '#f2efe6',
    surfaceLight: '#f2efe6',
    locked: true,
    constraint:
      'Brutalist styles are built from a black keyline and a hard offset shadow. Both need a light page to read against — on a dark background the outline and the shadow vanish into it.',
  },
];

const byId = new Map(CATEGORY_DEFS.map((c) => [c.id, c]));

export const categoryDef = (id: CategoryId): CategoryDef =>
  byId.get(id) ?? CATEGORY_DEFS[0];

/** The ground a category must be previewed on, for the given theme. */
export function categorySurface(id: CategoryId, dark = true): string {
  const def = categoryDef(id);
  return dark ? def.surface : def.surfaceLight ?? def.surface;
}
