/**
 * Full self-booting embed: core plus every style and effect, in one file.
 *
 * This is the "just give me everything" build — useful for local development,
 * for self-hosting, and for the CursorKit site itself, which switches styles
 * live. Production embeds served from the CDN use the split core + chunks
 * instead, which is several times smaller for any single configuration.
 */

import './core-entry';
import { effectDefs } from './effects';
import { styleDefs } from './styles';
import type { CursorKitAPI } from './core-entry';

const ck = (globalThis as unknown as { CursorKit: CursorKitAPI }).CursorKit;

ck.registerStyle(...styleDefs);
ck.registerEffect(...effectDefs);

// Boot from this script tag's own query string and data attributes.
ck.boot(ck.readScriptOptions());
