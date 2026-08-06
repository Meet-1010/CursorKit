/**
 * `dashboard.js` — the builder, embedded in someone else's site.
 *
 * This bundle carries the whole library rather than a single configuration,
 * because its entire purpose is switching between styles at runtime. That makes
 * it much larger than an embed, which is the correct trade: an authoring tool
 * is loaded deliberately, by a site owner, not by every visitor.
 *
 *   <script src="https://cursorkit.io/dashboard.js"></script>
 *   <script src="https://cursorkit.io/dashboard.js?persist=1&position=bottom-left"></script>
 *
 * With `persist=1` the visitor's choice is stored and re-applied on the next
 * load, which is what a site owner wants while they are deciding. Without it,
 * the panel is a preview and the tag in the footer is the thing to keep.
 */

import './core-entry';
import { effectDefs } from './effects';
import { hoverTransforms } from './hover';
import { styleDefs } from './styles';
import { Dashboard, loadSaved, type DashboardOptions } from './dashboard/ui';
import type { CursorKitAPI } from './core-entry';
import type { Options } from './core/types';

const ck = (globalThis as unknown as { CursorKit: CursorKitAPI }).CursorKit;

ck.registerStyle(...styleDefs);
ck.registerEffect(...effectDefs);
ck.registerHover(...hoverTransforms);

const opts = ck.readScriptOptions();
const q = readOwnQuery();

const persist = q.get('persist') === '1' || q.get('persist') === 'true';
const dashOpts: Partial<DashboardOptions> = {
  persist,
  headless: q.get('panel') === 'hidden',
  position: (q.get('position') as DashboardOptions['position']) || 'bottom-right',
  origin: q.get('origin') || inferOrigin(),
  accent: q.get('accent') ? `#${q.get('accent')!.replace(/^#/, '')}` : '#ffa132',
};

// A saved choice outranks the script tag's parameters: the tag is the default,
// and the saved value is a decision someone already made on top of it.
const saved = persist ? loadSaved() : null;
const initial: Partial<Options> = { ...opts, ...saved };

ck.boot(initial);

const dashboard = new Dashboard(ck, dashOpts, initial);

// Exposed so a host page can wire the panel to its own button.
(ck as unknown as { dashboard: Dashboard }).dashboard = dashboard;

function readOwnQuery(): URLSearchParams {
  let src = '';
  const cur = document.currentScript as HTMLScriptElement | null;
  if (cur) src = cur.src;
  else {
    const all = document.querySelectorAll<HTMLScriptElement>('script[src*="dashboard.js"]');
    src = all[all.length - 1]?.src || '';
  }
  try {
    return new URL(src, location.href).searchParams;
  } catch {
    return new URLSearchParams();
  }
}

/** Default the copyable tag's origin to wherever this script was served from. */
function inferOrigin(): string {
  const cur = document.currentScript as HTMLScriptElement | null;
  try {
    return cur?.src ? new URL(cur.src).origin : 'https://cursorkit.io';
  } catch {
    return 'https://cursorkit.io';
  }
}
