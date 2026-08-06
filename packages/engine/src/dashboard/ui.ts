/**
 * The embeddable builder dashboard.
 *
 * A site owner drops one script tag in and gets the whole builder inside their
 * own page — pick a cursor, tune it, and either copy the embed tag or save the
 * choice so it applies to every visitor.
 *
 * Two constraints shape everything here:
 *
 *   It has to survive an unknown host page. The panel lives in a shadow root
 *   with its own reset, because otherwise the host's `* { box-sizing }`, its
 *   button styles, and its CSS framework all land on this UI. Nothing here uses
 *   a global class name or touches the host's stylesheet.
 *
 *   It cannot bring a framework. This ships to other people's sites, so it is
 *   plain DOM construction — no React, no template library, no runtime beyond
 *   the engine itself.
 */

import { toParams } from '../core/options';
import type { Options } from '../core/types';
import {
  CATEGORIES,
  FAMILIES,
  PALETTES,
  effectMeta,
  hoverMeta,
  styleMeta,
} from '../manifest';
import type { CursorKitAPI } from '../core-entry';

const STORE_KEY = 'cursorkit:config';

export interface DashboardOptions {
  /** Corner for the launcher button. */
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Persist the visitor's choice and re-apply it on the next page load. */
  persist: boolean;
  /** Start with no launcher; the host opens it via `CursorKit.dashboard.open()`. */
  headless: boolean;
  /** Origin used when building the copyable embed tag. */
  origin: string;
  /** Accent colour for the panel chrome itself. */
  accent: string;
}

export const DASHBOARD_DEFAULTS: DashboardOptions = {
  position: 'bottom-right',
  persist: false,
  headless: false,
  origin: 'https://cursorkit.io',
  accent: '#ffa132',
};

const CSS = `
:host { all: initial; }
* { box-sizing: border-box; margin: 0; padding: 0; font-family: inherit; }
.root {
  --bg: #101520; --panel: #161c29; --rule: #212938;
  --ink: #dfe4ec; --dim: #8b95a6; --accent: var(--ck-accent, #ffa132);
  position: fixed; z-index: 2147483646;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 13px; color: var(--ink); line-height: 1.45;
}
.root[data-pos="bottom-right"] { right: 16px; bottom: 16px; }
.root[data-pos="bottom-left"]  { left: 16px;  bottom: 16px; }
.root[data-pos="top-right"]    { right: 16px; top: 16px; }
.root[data-pos="top-left"]     { left: 16px;  top: 16px; }

.launch {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg); color: var(--ink);
  border: 1px solid var(--rule); border-radius: 999px;
  padding: 9px 15px 9px 12px; cursor: pointer;
  box-shadow: 0 10px 30px -12px rgba(0,0,0,.7);
  font-size: 12px; letter-spacing: .06em; text-transform: uppercase;
}
.launch:hover { border-color: var(--dim); }
.launch svg { display: block; }

.panel {
  width: min(340px, calc(100vw - 32px));
  max-height: min(560px, calc(100vh - 32px));
  display: none; flex-direction: column;
  background: var(--bg); border: 1px solid var(--rule); border-radius: 8px;
  box-shadow: 0 24px 60px -20px rgba(0,0,0,.8); overflow: hidden;
}
.root[data-open="1"] .panel { display: flex; }
.root[data-open="1"] .launch { display: none; }

.head { display: flex; align-items: center; justify-content: space-between;
  padding: 11px 13px; border-bottom: 1px solid var(--rule); flex: none; }
.title { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--dim); }
.close { background: none; border: 0; color: var(--dim); cursor: pointer;
  font-size: 17px; line-height: 1; padding: 2px 5px; }
.close:hover { color: var(--ink); }

.body { overflow-y: auto; padding: 13px; display: flex; flex-direction: column; gap: 15px; }
.group { display: flex; flex-direction: column; gap: 7px; }
.label { font-size: 10px; letter-spacing: .13em; text-transform: uppercase; color: var(--dim); }

select, input[type="text"] {
  width: 100%; background: #0a0d13; color: var(--ink);
  border: 1px solid var(--rule); border-radius: 4px; padding: 7px 8px;
  font-size: 12px; font-family: inherit;
}
select:focus-visible, input:focus-visible, button:focus-visible {
  outline: 2px solid var(--accent); outline-offset: 1px;
}

.list { max-height: 132px; overflow-y: auto; border: 1px solid var(--rule);
  border-radius: 4px; background: #0a0d13; }
.item { display: block; width: 100%; text-align: left; background: none; border: 0;
  color: var(--dim); padding: 5px 9px; cursor: pointer; font-size: 12px; font-family: inherit; }
.item:hover { color: var(--ink); background: var(--panel); }
.item[aria-selected="true"] { color: var(--accent); }

.swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(30px, 1fr)); gap: 5px; }
.sw { height: 26px; border-radius: 4px; border: 1px solid var(--rule); cursor: pointer;
  position: relative; overflow: hidden; padding: 0; }
.sw[aria-selected="true"] { border-color: var(--ink); box-shadow: 0 0 0 1px var(--ink); }
.sw i { position: absolute; inset: 0; display: block; }
.sw i:last-child { left: 50%; }

.row { display: flex; align-items: center; gap: 9px; }
.row .label { flex: none; width: 52px; }
.row output { font-variant-numeric: tabular-nums; font-size: 11px;
  color: var(--accent); width: 32px; text-align: right; flex: none; }
input[type="range"] { flex: 1; -webkit-appearance: none; appearance: none;
  height: 18px; background: none; }
input[type="range"]::-webkit-slider-runnable-track { height: 1px; background: var(--rule); }
input[type="range"]::-moz-range-track { height: 1px; background: var(--rule); }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
  width: 3px; height: 13px; background: var(--accent); margin-top: -6px; border: 0; }
input[type="range"]::-moz-range-thumb { width: 3px; height: 13px; background: var(--accent); border: 0; border-radius: 0; }

.foot { flex: none; border-top: 1px solid var(--rule); padding: 11px 13px;
  display: flex; flex-direction: column; gap: 8px; }
code { display: block; background: #0a0d13; border: 1px solid var(--rule);
  border-radius: 4px; padding: 8px; font-size: 10.5px; line-height: 1.5;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  color: var(--dim); word-break: break-all; max-height: 62px; overflow-y: auto; }
.actions { display: flex; gap: 7px; }
.btn { flex: 1; background: none; color: var(--ink); border: 1px solid var(--rule);
  border-radius: 4px; padding: 8px; cursor: pointer; font-size: 11px;
  letter-spacing: .07em; text-transform: uppercase; font-family: inherit; }
.btn:hover { border-color: var(--dim); }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #0a0d13; font-weight: 600; }
.note { font-size: 10.5px; color: var(--dim); }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...kids: Array<Node | string>
): HTMLElementTagNameMap[K] => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...kids);
  return n;
};

export class Dashboard {
  private host: HTMLDivElement;
  private root: ShadowRoot;
  private wrap!: HTMLDivElement;
  private codeEl!: HTMLElement;
  private ck: CursorKitAPI;
  private opts: DashboardOptions;
  private cfg: Partial<Options>;

  constructor(ck: CursorKitAPI, opts: Partial<DashboardOptions>, initial: Partial<Options>) {
    this.ck = ck;
    this.opts = { ...DASHBOARD_DEFAULTS, ...opts };
    this.cfg = { ...initial, ...(this.opts.persist ? loadSaved() : null) };

    this.host = document.createElement('div');
    this.host.setAttribute('data-cursorkit', 'dashboard');
    // The dashboard's own controls keep the native cursor: a fancy cursor over
    // the tool used to choose it makes the tool harder to use.
    this.host.setAttribute('data-cursor', 'native');
    this.root = this.host.attachShadow({ mode: 'open' });
    this.root.append(el('style', {}, CSS));
    this.build();
    document.body.appendChild(this.host);

    if (this.opts.persist) this.ck.update(this.cfg);
  }

  open = (): void => {
    this.wrap.setAttribute('data-open', '1');
  };
  close = (): void => {
    this.wrap.removeAttribute('data-open');
  };
  destroy = (): void => {
    this.host.remove();
  };

  private apply(patch: Partial<Options>): void {
    Object.assign(this.cfg, patch);
    this.ck.update(patch);
    this.refreshCode();
    if (this.opts.persist) save(this.cfg);
  }

  private refreshCode(): void {
    const q = toParams(this.cfg);
    this.codeEl.textContent =
      `<script src="${this.opts.origin}/embed.js${q ? '?' + q : ''}"><\/script>`;
  }

  /* ------------------------------------------------------------------ ui */

  private build(): void {
    const wrap = el('div', { class: 'root', 'data-pos': this.opts.position });
    wrap.style.setProperty('--ck-accent', this.opts.accent);
    this.wrap = wrap;

    if (!this.opts.headless) {
      const launch = el('button', { class: 'launch', type: 'button' });
      launch.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
        '<path d="M1 5.5V1h4.5M12.5 1H17v4.5M17 12.5V17h-4.5M5.5 17H1v-4.5" ' +
        'stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="9" r="2.2" fill="currentColor"/></svg>' +
        '<span>Cursor</span>';
      launch.onclick = this.open;
      wrap.append(launch);
    }

    const panel = el('div', { class: 'panel', role: 'dialog', 'aria-label': 'Cursor settings' });
    const closeBtn = el('button', { class: 'close', type: 'button', 'aria-label': 'Close' }, '×');
    closeBtn.onclick = this.close;
    panel.append(
      el('div', { class: 'head' }, el('span', { class: 'title' }, 'CursorKit'), closeBtn),
    );

    const body = el('div', { class: 'body' });

    /* Style: a category select driving a filtered list. Two controls instead
       of one 169-item dropdown, which is unusable at this width. */
    const styleList = el('div', { class: 'list', role: 'listbox' });
    const catSel = el('select', { 'aria-label': 'Category' });
    for (const cat of CATEGORIES) {
      catSel.append(el('option', { value: cat.id }, cat.name));
    }
    const fillStyles = (category: string) => {
      styleList.replaceChildren();
      for (const s of styleMeta.filter((m) => m.category === category)) {
        const b = el('button', { class: 'item', type: 'button', title: s.blurb }, s.name);
        b.setAttribute('aria-selected', String(s.id === this.cfg.style));
        b.onclick = () => {
          this.apply({ style: s.id });
          styleList.querySelectorAll('[aria-selected]').forEach((n) =>
            n.setAttribute('aria-selected', 'false'),
          );
          b.setAttribute('aria-selected', 'true');
        };
        styleList.append(b);
      }
    };
    const current = styleMeta.find((m) => m.id === this.cfg.style);
    catSel.value = current?.category ?? CATEGORIES[0].id;
    catSel.onchange = () => fillStyles(catSel.value);
    fillStyles(catSel.value);
    body.append(group('Cursor', catSel, styleList));

    /* Click effect, grouped by family the same way. */
    const fxList = el('div', { class: 'list', role: 'listbox' });
    const famSel = el('select', { 'aria-label': 'Effect family' });
    for (const f of FAMILIES) famSel.append(el('option', { value: f.id }, f.name));
    const fillFx = (family: string) => {
      fxList.replaceChildren();
      for (const e of effectMeta.filter((m) => m.family === family)) {
        const b = el('button', { class: 'item', type: 'button', title: e.blurb }, e.name);
        b.setAttribute('aria-selected', String(e.id === this.cfg.click));
        b.onclick = () => {
          this.apply({ click: e.id });
          fxList.querySelectorAll('[aria-selected]').forEach((n) =>
            n.setAttribute('aria-selected', 'false'),
          );
          b.setAttribute('aria-selected', 'true');
        };
        fxList.append(b);
      }
    };
    famSel.value = effectMeta.find((m) => m.id === this.cfg.click)?.family ?? FAMILIES[0].id;
    famSel.onchange = () => fillFx(famSel.value);
    fillFx(famSel.value);
    body.append(group('Click effect', famSel, fxList));

    /* Hover transform. */
    const hoverSel = el('select', { 'aria-label': 'Hover transform' });
    for (const h of hoverMeta) {
      const o = el('option', { value: h.id }, h.name);
      hoverSel.append(o);
    }
    hoverSel.value = this.cfg.hover ?? 'scale-expand';
    hoverSel.onchange = () => this.apply({ hover: hoverSel.value });
    body.append(group('Hover', hoverSel));

    /* Palettes, as two-tone swatches. */
    const sw = el('div', { class: 'swatches' });
    for (const pal of PALETTES) {
      const b = el('button', { class: 'sw', type: 'button', title: `${pal.name} — ${pal.note}` });
      b.setAttribute('aria-selected', String(pal.color === this.cfg.color));
      b.append(
        el('i', { style: `background:#${pal.color}` }),
        el('i', { style: `background:#${pal.color2}` }),
      );
      b.onclick = () => {
        this.apply({ color: pal.color, color2: pal.color2 });
        sw.querySelectorAll('[aria-selected]').forEach((n) =>
          n.setAttribute('aria-selected', 'false'),
        );
        b.setAttribute('aria-selected', 'true');
      };
      sw.append(b);
    }
    body.append(group('Palette', sw));

    /* Numeric parameters. */
    body.append(
      group(
        'Size',
        slider('size', 0.4, 3, 0.05, this.cfg.size ?? 1, (v) => this.apply({ size: v })),
      ),
      group(
        'Speed',
        slider('speed', 0.25, 3, 0.05, this.cfg.speed ?? 1, (v) => this.apply({ speed: v })),
      ),
      group(
        'Opacity',
        slider('opacity', 0.05, 1, 0.05, this.cfg.opacity ?? 1, (v) => this.apply({ opacity: v })),
      ),
    );

    panel.append(body);

    /* Footer: the tag, and the two things a site owner actually wants to do. */
    this.codeEl = el('code');
    this.refreshCode();
    const copyBtn = el('button', { class: 'btn', type: 'button' }, 'Copy tag');
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(this.codeEl.textContent || '');
        copyBtn.textContent = 'Copied';
      } catch {
        // Clipboard may be blocked by permissions policy; the text is
        // selectable either way, so say what actually happened.
        copyBtn.textContent = 'Select & copy';
      }
      setTimeout(() => (copyBtn.textContent = 'Copy tag'), 1600);
    };

    const saveBtn = el('button', { class: 'btn btn-primary', type: 'button' }, 'Save for this site');
    saveBtn.onclick = () => {
      save(this.cfg);
      this.opts.persist = true;
      saveBtn.textContent = 'Saved';
      setTimeout(() => (saveBtn.textContent = 'Save for this site'), 1600);
    };

    const foot = el(
      'div',
      { class: 'foot' },
      this.codeEl,
      el('div', { class: 'actions' }, copyBtn, saveBtn),
      el(
        'p',
        { class: 'note' },
        'Saving stores the choice in this browser only. Paste the tag to set it for everyone.',
      ),
    );
    panel.append(foot);
    wrap.append(panel);
    this.root.append(wrap);

    // Escape closes, matching every other dialog on the web.
    this.root.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Escape') this.close();
    });
  }
}

/* --------------------------------------------------------------- helpers */

function group(label: string, ...kids: Node[]): HTMLElement {
  return el('div', { class: 'group' }, el('span', { class: 'label' }, label), ...kids);
}

function slider(
  name: string,
  min: number,
  max: number,
  step: number,
  value: number,
  onInput: (v: number) => void,
): HTMLElement {
  const input = el('input', {
    type: 'range',
    min: String(min),
    max: String(max),
    step: String(step),
    value: String(value),
    'aria-label': name,
  }) as HTMLInputElement;
  const out = el('output', {}, value.toFixed(2));
  input.oninput = () => {
    const v = Number(input.value);
    out.textContent = v.toFixed(2);
    onInput(v);
  };
  return el('div', { class: 'row' }, input, out);
}

function save(cfg: Partial<Options>): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(cfg));
  } catch {
    /* private mode, or storage disabled — the choice just will not persist */
  }
}

export function loadSaved(): Partial<Options> | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Options>) : null;
  } catch {
    return null;
  }
}
