import type { CategoryId } from './core/types';

/**
 * Curated colour pairs for cursors.
 *
 * Picking cursor colour is not the same problem as picking brand colour, and
 * the difference is why a generic swatch grid gives bad results here. A cursor
 * is small, always in motion, and sits over content the designer has already
 * chosen — so it has to stay legible against *both* ends of the page's tonal
 * range, not just look good on a swatch.
 *
 * Three rules produced this list:
 *
 *   1. The primary is the colour you see; the accent is what trails, glows or
 *      fills behind it. They are never the same lightness, because a trail that
 *      matches its head reads as one flat smear at speed.
 *   2. Nothing sits at maximum saturation on both channels. Two fully saturated
 *      colours vibrate against each other at cursor scale.
 *   3. Every pair is tagged with the grounds it survives on. A pale pair on a
 *      light page is invisible, and that is the most common way a custom cursor
 *      goes wrong in practice.
 */

export type Ground = 'dark' | 'light' | 'any';

export interface Palette {
  id: string;
  name: string;
  /** Primary cursor colour, hex without `#`. */
  color: string;
  /** Accent for trails, glows, secondary particles. */
  color2: string;
  /** Which page backgrounds this pair actually reads on. */
  ground: Ground;
  /** One line on where it came from and what it is for. */
  note: string;
  /** Categories this pairing was tuned against. Empty means general purpose. */
  suits?: CategoryId[];
}

export const PALETTES: Palette[] = [
  /* -------------------------------------------------------------- neutral */
  {
    id: 'paper',
    name: 'Paper',
    color: 'ffffff',
    color2: 'c9d1de',
    ground: 'dark',
    note: 'Plain white with a cool grey trail. The safest cursor on any dark page.',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    color: '1a2130',
    color2: '5d6879',
    ground: 'light',
    note: 'Near-black with a slate trail — the light-page counterpart to Paper.',
  },
  {
    id: 'bone',
    name: 'Bone',
    color: 'ece5d8',
    color2: 'a89a80',
    ground: 'dark',
    note: 'Warm off-white. Softer than pure white on editorial and photographic pages.',
    suits: ['luxury'],
  },

  /* ------------------------------------------------------------ instrument */
  {
    id: 'phosphor',
    name: 'Phosphor',
    color: 'ffa132',
    color2: 'ffd9a0',
    ground: 'dark',
    note: 'Amber signal on slate, the way aircraft and oscilloscope displays are lit.',
    suits: ['tech', 'minimal'],
  },
  {
    id: 'terminal',
    name: 'Terminal',
    color: '4ade80',
    color2: 'bbf7d0',
    ground: 'dark',
    note: 'Green-screen phosphor. Reads instantly as a machine, for better or worse.',
    suits: ['tech'],
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    color: '7dd3fc',
    color2: 'ffffff',
    ground: 'dark',
    note: 'Drafting cyan with white highlights. Precise without being cold.',
    suits: ['tech', 'geometric'],
  },
  {
    id: 'radar',
    name: 'Radar',
    color: '5eead4',
    color2: '0d9488',
    ground: 'dark',
    note: 'Sonar teal with a darker sweep. Good for anything that scans or pings.',
    suits: ['tech'],
  },

  /* ---------------------------------------------------------------- vivid */
  {
    id: 'magenta-drive',
    name: 'Magenta Drive',
    color: 'ff4d9d',
    color2: '9b5cff',
    ground: 'dark',
    note: 'Hot pink into violet. The loudest pair that still stays readable.',
    suits: ['particle'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    color: 'ff8a3d',
    color2: 'ff3d7f',
    ground: 'any',
    note: 'Orange through to rose. Warm, energetic, survives on light grounds too.',
  },
  {
    id: 'electric',
    name: 'Electric',
    color: '35e0ff',
    color2: 'b04dff',
    ground: 'dark',
    note: 'Cyan and violet — the pair that makes additive neon glow properly.',
    suits: ['particle'],
  },
  {
    id: 'acid',
    name: 'Acid',
    color: 'd4ff3d',
    color2: '00e5a0',
    ground: 'dark',
    note: 'Chartreuse and mint. Aggressive, and deliberately hard to ignore.',
    suits: ['brutalist'],
  },
  {
    id: 'ember',
    name: 'Ember',
    color: 'ff5f1f',
    color2: 'ffc857',
    ground: 'dark',
    note: 'Fire orange cooling to yellow. Built for sparks, flame and embers.',
    suits: ['particle', 'playful'],
  },

  /* -------------------------------------------------------------- material */
  {
    id: 'gold',
    name: 'Gold',
    color: 'd4a437',
    color2: 'fff3c4',
    ground: 'any',
    note: 'Antique gold with a pale specular. Reads as metal, not as yellow.',
    suits: ['luxury'],
  },
  {
    id: 'copper',
    name: 'Copper',
    color: 'c67b42',
    color2: 'f3c9a8',
    ground: 'any',
    note: 'Warm oxidised copper with a soft highlight. Ages a page instantly.',
    suits: ['luxury'],
  },
  {
    id: 'clay',
    name: 'Clay',
    color: 'e0e5ec',
    color2: 'a3b1c6',
    ground: 'light',
    note: 'The canonical soft-UI grey. Neumorphism needs this exact tonal range.',
    suits: ['neumorphic'],
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    color: '2a3040',
    color2: '4c5670',
    ground: 'dark',
    note: 'Dark soft-UI. Neumorphism on a dark page, which most generators skip.',
    suits: ['neumorphic'],
  },

  /* ----------------------------------------------------------------- glass */

  /* ------------------------------------------------------------- brutalist */
  {
    id: 'gumroad',
    name: 'Hard Yellow',
    color: 'ffd23f',
    color2: 'ff5c5c',
    ground: 'any',
    note: 'Flat primary yellow against red. Built for thick keylines and hard shadows.',
    suits: ['brutalist'],
  },
  {
    id: 'riso',
    name: 'Riso',
    color: 'ff48b0',
    color2: '3d5afe',
    ground: 'light',
    note: 'Risograph pink and blue. Overprints well, misregisters on purpose.',
    suits: ['brutalist'],
  },
  {
    id: 'signal-red',
    name: 'Signal Red',
    color: 'ff3b30',
    color2: '1a2130',
    ground: 'light',
    note: 'Emergency red on ink. Maximum urgency, minimum decoration.',
    suits: ['brutalist'],
  },

  /* --------------------------------------------------------------- organic */
  {
    id: 'ink-wash',
    name: 'Ink Wash',
    color: '1f2933',
    color2: '7b8794',
    ground: 'light',
    note: 'Sumi ink and its dilution. Made for brush, ink and watercolour styles.',
    suits: ['fluid', 'trail'],
  },
  {
    id: 'moss',
    name: 'Moss',
    color: '8fbf6f',
    color2: '3f6b3a',
    ground: 'dark',
    note: 'Living green with a shaded understory. Organic without being literal.',
    suits: ['fluid', 'particle'],
  },
  {
    id: 'coral',
    name: 'Coral',
    color: 'ff7a6b',
    color2: 'ffd6a5',
    ground: 'any',
    note: 'Soft coral and sand. Friendly, warm, and legible on either ground.',
    suits: ['playful'],
  },

  /* ------------------------------------------------- skeuomorphic materials */
  {
    id: 'oxblood',
    name: 'Oxblood',
    color: '6e2733',
    color2: 'd9b382',
    ground: 'any',
    note: 'Bookbinding leather with a contrast saddle stitch.',
    suits: ['luxury'],
  },
  {
    id: 'ivory-key',
    name: 'Ivory',
    color: 'ece3d2',
    color2: '8c7f68',
    ground: 'dark',
    note: 'Aged keycap ivory against a shaded underside.',
    suits: ['luxury'],
  },

  /* --------------------------------------------------------- soft UI greys */
  {
    id: 'clay-warm',
    name: 'Warm Clay',
    color: 'e8e2d9',
    color2: 'b8ada0',
    ground: 'light',
    note: 'Warm soft-UI base. Neumorphism without the corporate blue cast.',
    suits: ['neumorphic'],
  },
  {
    id: 'slate-soft',
    name: 'Soft Slate',
    color: '353b48',
    color2: '5c6478',
    ground: 'dark',
    note: 'Mid-dark soft UI — shadows still read, unlike on true black.',
    suits: ['neumorphic'],
  },
  {
    id: 'sand-soft',
    name: 'Soft Sand',
    color: 'ded5c4',
    color2: 'aa9d86',
    ground: 'light',
    note: 'Sun-bleached soft UI. Reads as moulded plaster rather than plastic.',
    suits: ['neumorphic'],
  },

  /* ------------------------------------------------------------- glass tints */

  /* ------------------------------------------------------------- brutalist */
  {
    id: 'safety',
    name: 'Safety Orange',
    color: 'ff6b1a',
    color2: '111111',
    ground: 'light',
    note: 'Hazard orange against ink. Industrial signage, not decoration.',
    suits: ['brutalist'],
  },
  {
    id: 'xerox',
    name: 'Xerox',
    color: 'ffffff',
    color2: '111111',
    ground: 'light',
    note: 'Pure black and white. Photocopier brutalism with no colour at all.',
    suits: ['brutalist'],
  },
  {
    id: 'cyan-block',
    name: 'Block Cyan',
    color: '00c2ff',
    color2: '111111',
    ground: 'light',
    note: 'Flat process cyan with a black keyline. Screen-print flat.',
    suits: ['brutalist'],
  },
  {
    id: 'lime-block',
    name: 'Block Lime',
    color: 'c4f000',
    color2: '111111',
    ground: 'light',
    note: 'Highlighter lime. Loud enough to be a warning.',
    suits: ['brutalist'],
  },

  /* ------------------------------------------------------------ maximalist */
  {
    id: 'tropicalia',
    name: 'Tropicália',
    color: 'ffbe0b',
    color2: 'fb5607',
    ground: 'any',
    note: 'Marigold into flame. Warm maximalism that stays readable.',
    suits: ['playful'],
  },
  {
    id: 'ultraviolet',
    name: 'Ultraviolet',
    color: 'b14aed',
    color2: '2de2e6',
    ground: 'dark',
    note: 'Violet and turquoise, the two hues additive blending flatters most.',
    suits: ['particle'],
  },
  {
    id: 'candy-shop',
    name: 'Candy',
    color: 'ff5d8f',
    color2: 'fff3b0',
    ground: 'any',
    note: 'Sweet-shop pink and cream. Glossy without being sickly.',
    suits: ['playful'],
  },

  /* ----------------------------------------------------------- more general */
  {
    id: 'oxide',
    name: 'Oxide',
    color: 'd35400',
    color2: 'ffd9a0',
    ground: 'any',
    note: 'Rust and sand. Earthy without going brown.',
  },
  {
    id: 'deep-sea',
    name: 'Deep Sea',
    color: '2dd4bf',
    color2: '0e7490',
    ground: 'dark',
    note: 'Bioluminescent teal descending into a colder blue.',
  },
  {
    id: 'iris',
    name: 'Iris',
    color: '818cf8',
    color2: 'c4b5fd',
    ground: 'any',
    note: 'Soft periwinkle. The gentlest pair in the set.',
  },
  {
    id: 'monochrome-red',
    name: 'Signal Only',
    color: 'ff2d2d',
    color2: '7a0d0d',
    ground: 'dark',
    note: 'One hue, two values. Reads as an alert state without any second colour.',
  },
  {
    id: 'lichen',
    name: 'Lichen',
    color: 'c2d6a4',
    color2: '6b7f52',
    ground: 'dark',
    note: 'Pale sage over olive. Quiet, organic, unusual on screen.',
  },
  {
    id: 'porcelain',
    name: 'Porcelain',
    color: 'f4f6f8',
    color2: '9db4c8',
    ground: 'dark',
    note: 'Cool white with a blue shadow. Clinical in a good way.',
  },
  {
    id: 'noir',
    name: 'Noir',
    color: '111418',
    color2: '8a94a6',
    ground: 'light',
    note: 'Near-black with a grey trail. For light pages that want no colour.',
  },
  {
    id: 'marigold',
    name: 'Marigold',
    color: 'f7b32b',
    color2: '9a4c00',
    ground: 'any',
    note: 'Saturated yellow with a burnt shadow. Warm and legible on both grounds.',
  },
];


export const paletteById = (id: string): Palette | undefined =>
  PALETTES.find((p) => p.id === id);

/** Palettes explicitly tuned for a category, best matches first. */
export function palettesFor(category: CategoryId): Palette[] {
  const tuned = PALETTES.filter((p) => p.suits?.includes(category));
  const general = PALETTES.filter((p) => !p.suits?.length);
  return [...tuned, ...general];
}

export const PALETTE_COUNT = PALETTES.length;
