/**
 * The whole library, registered but *not* booted.
 *
 * `embed.js` boots itself from its own script tag, which is right for a site
 * owner pasting one line into a template and wrong for anything that decides at
 * runtime whether a cursor should exist at all — the browser extension, which
 * has to read stored settings and may conclude the answer is "not on this
 * site", and any host that wants to own the lifecycle.
 *
 * Loading this file gives you a populated `window.CursorKit` and nothing else
 * happens until you call `boot`.
 */

import './core-entry';
import { effectDefs } from './effects';
import { hoverTransforms } from './hover';
import { styleDefs } from './styles';
import type { CursorKitAPI } from './core-entry';

const ck = (globalThis as unknown as { CursorKit: CursorKitAPI }).CursorKit;

ck.registerStyle(...styleDefs);
ck.registerEffect(...effectDefs);
ck.registerHover(...hoverTransforms);
