/**
 * Public ESM entry. This is what the website imports; the browser embed uses
 * `embed.ts` (everything) or `core-entry.ts` plus chunks (per-config).
 */

import { effectDefs } from './effects';
import { hoverTransforms } from './hover';
import { registerEffect, registerHover, registerStyle } from './core/registry';
import { styleDefs } from './styles';

// Registering at import time means `new Engine()` just works for consumers who
// pull in the library, without a separate install step to remember.
registerStyle(...styleDefs);
registerEffect(...effectDefs);
registerHover(...hoverTransforms);

export { Engine, boot } from './core/engine';
export type { EngineHost } from './core/engine';
export { PointerTracker } from './core/pointer';
export { Surface, hideNativeCursor, restoreNativeCursor } from './core/surface';
export { HoverWatcher, classify } from './core/hover';
export {
  DEFAULTS,
  fromParams,
  toParams,
  readScriptOptions,
  hasFinePointer,
  prefersReducedMotion,
} from './core/options';
export {
  registerStyle,
  registerEffect,
  registerHover,
  getStyle,
  getEffect,
  getHover,
  allStyles,
  allEffects,
  allHovers,
  hasStyle,
  hasEffect,
} from './core/registry';

export { styleDefs } from './styles';
export { effectDefs } from './effects';
export { hoverTransforms } from './hover';

export * from './manifest';
export type * from './core/types';
export * as math from './core/math';
