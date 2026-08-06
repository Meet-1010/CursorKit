import type { RGB } from '@ck/math';

export type CategoryId =
  | 'minimal'
  | 'geometric'
  | 'fluid'
  | 'trail'
  | 'particle'
  | 'tech'
  | 'playful'
  | 'luxury'
  | 'neumorphic'
  | 'brutalist';

export type FamilyId =
  | 'ripple'
  | 'burst'
  | 'shock'
  | 'ink'
  | 'digital'
  | 'physics'
  | 'portal'
  | 'subtle'
  | 'material'
  | 'chaos';

export type BlendMode =
  | 'normal'
  | 'difference'
  | 'exclusion'
  | 'screen'
  | 'multiply'
  | 'overlay'
  | 'lighten'
  | 'hard-light';

/** What kind of thing the pointer is currently over. */
export type HoverKind = 'none' | 'link' | 'button' | 'image' | 'text' | 'custom' | 'native';

export interface Options {
  style: string;
  click: string;
  hover: string;
  color: string;
  color2: string;
  size: number;
  speed: number;
  opacity: number;
  blend: BlendMode;
  dark: boolean;
  /** Downgrade motion when the OS asks for it. Off means "I know what I'm doing". */
  respectReducedMotion: boolean;
  /** Render on touch devices too. Almost always wrong; here for kiosk displays. */
  touch: boolean;
  /**
   * Shift the cursor colour to stay legible against the page beneath it.
   * On by default: a cursor you cannot see is worse than one slightly off-brand.
   */
  adapt: boolean;
  /** Stacking context for the overlay. */
  zIndex: number;
  /** CSS selector for elements that keep the native cursor. */
  ignore: string;
}

export interface Pointer {
  /** Raw client position, updated on every pointermove. */
  x: number;
  y: number;
  /** Velocity in css px/second, smoothed over a few frames. */
  vx: number;
  vy: number;
  speed: number;
  /** Smoothed heading in radians. Stable when nearly still. */
  angle: number;
  /** True between pointerdown and pointerup. */
  down: boolean;
  /** Eased 0→1 press amount, so styles can squash without reading raw events. */
  press: number;
  /** Seconds since the last press began. */
  sinceDown: number;
  hover: HoverKind;
  /** Eased 0→1 hover amount. */
  hoverAmt: number;
  hoverRect: DOMRect | null;
  hoverEl: Element | null;
  /** From `data-cursor-label`, for label-style hover transforms. */
  label: string | null;
  /** Pointer is inside the viewport. */
  inside: boolean;
  /** Eased 0→1 visibility, drives fade in/out at the window edge. */
  vis: number;
  /** Seconds since the pointer last moved meaningfully. */
  idle: number;
  /** Seconds since the engine started. */
  t: number;
  /** Ring buffer of recent positions, newest first: [x, y, x, y, ...]. */
  trail: Float32Array;
  /** Number of valid samples in `trail`. */
  trailLen: number;
}

/** Everything a style or effect needs to draw one frame. */
export interface Ctx {
  c: CanvasRenderingContext2D;
  p: Pointer;
  o: Options;
  /** Seconds since last frame, clamped and already scaled by `speed`. */
  dt: number;
  /** Engine time in seconds, scaled by `speed`. */
  t: number;
  /** Viewport size in css px. */
  w: number;
  h: number;
  dpr: number;
  /**
   * Primary colour to draw with.
   *
   * When `adapt` is on this is already shifted to keep contrast against
   * whatever the cursor is currently over — so an ordinary style gets adaptive
   * behaviour without knowing this happened. Hue and saturation are preserved;
   * only lightness moves.
   */
  col: RGB;
  /** Secondary colour, for trails and accents. Adapted alongside `col`. */
  col2: RGB;
  /** The configured colour, before adaptation. For styles that must not adapt. */
  rawCol: RGB;
  /**
   * The page colour under the cursor, as read from the DOM.
   *
   * Styles whose whole technique depends on matching the page — neumorphism
   * above all — should draw in this rather than in `col`.
   */
  backdrop: RGB;
  /** 0–1, eased. 1 means the cursor is over a light backdrop. */
  onLight: number;
  /** False when the backdrop is media or a gradient and cannot be resolved. */
  backdropKnown: boolean;
  /** Combined size multiplier: option size, times any hover scaling. */
  scale: number;
  /** Global alpha the engine wants applied, already folded into visibility. */
  alpha: number;
  /** Deterministic per-instance random source. */
  rnd: () => number;
  /** True when the engine is running in reduced-motion mode. */
  calm: boolean;
}

/**
 * A cursor style. Styles are pure: all mutable state lives in the bag returned
 * by `state()`, so one style definition can drive many simultaneous previews.
 */
export interface CursorStyle<S = any> {
  id: string;
  name: string;
  category: CategoryId;
  /** One line, sentence case, shown under the name in the gallery. */
  blurb: string;
  /** Suggested blend mode when the author has not chosen one. */
  blend?: BlendMode;
  /** Styles that read as a trail get a longer position history. */
  trail?: number;
  state?(): S;
  draw(ctx: Ctx, s: S): void;
  /**
   * Called instead of `draw` on frames the cursor is invisible — off-screen, or
   * over an element that asked for the native cursor back.
   *
   * Canvas styles need nothing here: the engine clears the frame for them. A
   * style backed by its own DOM does, because that DOM keeps painting whether
   * or not the engine drew a frame.
   */
  hidden?(s: S): void;
  /** Release anything `draw` created outside the canvas. */
  dispose?(s: S): void;
}

export interface EffectInstance {
  x: number;
  y: number;
  /** Seconds since spawn. Advanced by the engine. */
  age: number;
  /** Seconds until the engine culls it. */
  life: number;
  /** Normalised 0→1 progress. Recomputed by the engine each frame. */
  k: number;
  [extra: string]: unknown;
}

export interface ClickEffect<E extends EffectInstance = EffectInstance> {
  id: string;
  name: string;
  family: FamilyId;
  blurb: string;
  blend?: BlendMode;
  /** Draw beneath the cursor shape instead of above it. Default true. */
  under?: boolean;
  spawn(ctx: Ctx, x: number, y: number): E;
  draw(ctx: Ctx, e: E): void;
}

/**
 * A hover transform composes with any style: `pre` mutates the canvas transform
 * or ctx before the style draws, `post` draws overlays after.
 */
export interface HoverTransform {
  id: string;
  name: string;
  blurb: string;
  /** Pull the smoothed pointer toward the hovered element by this factor. */
  magnetism?: number;
  pre?(ctx: Ctx): void;
  post?(ctx: Ctx): void;
}
