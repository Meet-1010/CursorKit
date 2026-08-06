/**
 * Core-only browser entry.
 *
 * Publishes the engine and the shared math runtime on `window.CursorKit`, then
 * waits. Style and effect chunks loaded afterwards register themselves against
 * this global; `boot` is called by the assembled bootstrap the CDN appends.
 *
 * Deliberately does not import any style or effect — that separation is the
 * whole reason a two-module embed stays small.
 */

import * as math from './core/math';
import { Engine, boot } from './core/engine';
import {
  allEffects,
  allHovers,
  allStyles,
  getEffect,
  getHover,
  getStyle,
  registerEffect,
  registerHover,
  registerStyle,
} from './core/registry';
import { DEFAULTS, fromParams, readScriptOptions } from './core/options';
import type { Options } from './core/types';

/**
 * Hover transforms ship as chunks, exactly like styles and effects.
 *
 * They started out bundled into core on the theory that they were too small to
 * be worth a separate file. At eight transforms that was true; at thirty it put
 * ~3.8kb of unused behaviour into every embed and pushed the worst-case
 * configuration over the 15kb budget. Only `none` stays here, as the fallback
 * when a chunk fails to arrive — the engine treats a missing transform as "do
 * nothing", so a dropped request degrades rather than breaks.
 */
registerHover({
  id: 'none',
  name: 'None',
  blurb: 'The cursor ignores what it is over. Styles may still react on their own.',
});

let active: Engine | null = null;

const api = {
  version: __VERSION__,
  /** Shared runtime that chunks compile against. See `math-shim.ts`. */
  m: math,
  registerStyle,
  registerEffect,
  registerHover,
  getStyle,
  getEffect,
  getHover,
  allStyles,
  allEffects,
  allHovers,
  DEFAULTS,
  fromParams,
  readScriptOptions,

  /** Starts the page cursor. Safe to call twice — the first instance is torn down. */
  boot(options: Partial<Options> = {}): Engine | null {
    active?.destroy();
    active = boot(options);
    return active;
  },

  /** Change configuration on the fly. */
  update(patch: Partial<Options>): void {
    active?.update(patch);
  },

  /** Remove the cursor and restore the native one. */
  destroy(): void {
    active?.destroy();
    active = null;
  },

  get engine(): Engine | null {
    return active;
  },
};

declare const __VERSION__: string;

const g = globalThis as unknown as { CursorKit?: typeof api };
// Never clobber an existing instance: two copies of the script on one page
// should collapse to one cursor, not fight over the overlay.
if (!g.CursorKit) g.CursorKit = api;

export type CursorKitAPI = typeof api;
