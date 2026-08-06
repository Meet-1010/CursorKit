'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES,
  FAMILIES,
  PALETTES,
  categoryDef,
  effectMeta,
  hoverMeta,
  palettesFor,
  styleMeta,
  type CategoryId,
  type FamilyId,
  type Palette,
} from '@cursorkit/engine/manifest';
import { CopyLine } from '@/components/copy-line';
import { PreviewCanvas } from '@/components/preview-canvas';
import { useSiteCursor } from '@/components/site-cursor';
import {
  BLEND_MODES,
  BUILDER_DEFAULT,
  SITE_ORIGIN,
  embedTag,
  fromQuery,
  toQuery,
  type Config,
} from '@/lib/config';

/**
 * The builder console.
 *
 * Left rail picks the cursor, centre is the viewport, right rail is parameters,
 * and the generated tag docks along the bottom like a status bar. Configuration
 * lives in the URL, so the address bar is the share link with no extra step.
 */
export function Builder() {
  const params = useSearchParams();
  // Read the URL once on mount; after that the config is owned by this
  // component and pushed back out, so typing in a slider does not fight
  // with router state.
  const [cfg, setCfg] = useState<Config>(() => fromQuery(params, BUILDER_DEFAULT));
  const [mode, setMode] = useState<'scripted' | 'live'>('scripted');
  const [previewDark, setPreviewDark] = useState(true);
  const { preview } = useSiteCursor();
  const pushTimer = useRef<number>();

  const set = useCallback(<K extends keyof Config>(key: K, value: Config[K]) => {
    setCfg((prev) => {
      const next = { ...prev, [key]: value };
      // Switching into a language whose palette is part of its technique brings
      // that palette with it. Carrying the previous colours across would render
      // something that is not the language you just picked — neumorphism in an
      // arbitrary accent has nothing for its shadows to read against.
      if (key === 'style') {
        const def = categoryDef(
          styleMeta.find((s) => s.id === value)?.category ?? 'minimal',
        );
        const wasLocked = categoryDef(
          styleMeta.find((s) => s.id === prev.style)?.category ?? 'minimal',
        ).locked;
        if (def.locked || wasLocked) Object.assign(next, def.palette);
      }
      return next;
    });
  }, []);

  // Mirror the config into the address bar, debounced — a slider drag would
  // otherwise write dozens of history entries per second.
  useEffect(() => {
    window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => {
      const q = toQuery(cfg);
      window.history.replaceState(null, '', q ? `?${q}` : location.pathname);
    }, 260);
    return () => window.clearTimeout(pushTimer.current);
  }, [cfg]);

  // Applying to the page cursor is opt-in: it is a strong effect and the
  // viewport already shows the result.
  const [applied, setApplied] = useState(false);
  useEffect(() => {
    preview(applied ? cfg : null);
  }, [applied, cfg, preview]);
  useEffect(() => () => preview(null), [preview]);

  const tag = useMemo(() => embedTag(cfg), [cfg]);

  // The share link has to be the origin you are actually on, but reading
  // `location` during render would not match what the server produced. Start
  // from the canonical origin so hydration agrees, then correct after mount.
  const [origin, setOrigin] = useState(SITE_ORIGIN);
  useEffect(() => setOrigin(window.location.origin), []);
  const shareUrl = useMemo(() => {
    const q = toQuery(cfg);
    return `${origin}/builder${q ? '?' + q : ''}`;
  }, [cfg, origin]);

  return (
    <div className="shell py-8">
      <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)_16rem]">
        <StylePicker cfg={cfg} set={set} />

        <div className="flex min-w-0 flex-col gap-4">
          <Viewport
            cfg={cfg}
            mode={mode}
            setMode={setMode}
            dark={previewDark}
            setDark={setPreviewDark}
            applied={applied}
            setApplied={setApplied}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <CopyLine value={tag} />
            <CopyLine value={shareUrl} label="Share link" />
          </div>
        </div>

        <Parameters cfg={cfg} set={set} />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- viewport */

function Viewport({
  cfg,
  mode,
  setMode,
  dark,
  setDark,
  applied,
  setApplied,
}: {
  cfg: Config;
  mode: 'scripted' | 'live';
  setMode: (m: 'scripted' | 'live') => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  applied: boolean;
  setApplied: (a: boolean) => void;
}) {
  const style = styleMeta.find((s) => s.id === cfg.style);
  const effect = effectMeta.find((e) => e.id === cfg.click);
  const def = categoryDef(style?.category ?? 'minimal');

  // The viewport shows the ground the language needs, not the site's own. A
  // dark/light toggle would be meaningless for glass (which needs content) or
  // neumorphism (which needs one exact value), so for those it is disabled.
  const ground = def.locked
    ? def.surface
    : dark
      ? def.surface
      : def.surfaceLight ?? '#eef0f4';
  const groundIsDark = def.locked
    ? def.id !== 'neumorphic' && def.id !== 'brutalist'
    : dark;

  return (
    <section className="panel flex min-h-[26rem] flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-3 py-2">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="eyebrow">Viewport</span>
          <span className="readout truncate text-dim">
            {style?.name ?? cfg.style} · {effect?.name ?? cfg.click}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Toggle on={mode === 'live'} onClick={() => setMode(mode === 'live' ? 'scripted' : 'live')}>
            {mode === 'live' ? 'Live' : 'Auto'}
          </Toggle>
          <Toggle
            on={!dark}
            onClick={() => setDark(!dark)}
            disabled={def.locked}
            title={def.locked ? `${def.name} sets its own ground` : undefined}
          >
            {groundIsDark ? 'Dark' : 'Light'}
          </Toggle>
          <Toggle on={applied} onClick={() => setApplied(!applied)}>
            Whole page
          </Toggle>
        </div>
      </header>

      <div className="relative flex-1" style={{ background: ground }}>
        <PreviewCanvas config={cfg} mode={mode} interactive seed={7} />

        {/* Targets, so hover transforms have something to react to. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 px-6">
            <button
              type="button"
              className="rounded-sm border px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.1em] transition-colors"
              style={{
                borderColor: groundIsDark ? 'rgba(255,255,255,.22)' : 'rgba(10,13,19,.25)',
                color: groundIsDark ? '#f2f5fa' : '#141a26',
              }}
              data-cursor-label="Button"
            >
              A button
            </button>
            <a
              href="#viewport-link"
              onClick={(e) => e.preventDefault()}
              className="font-mono text-[0.72rem] uppercase tracking-[0.1em] underline underline-offset-4"
              style={{ color: groundIsDark ? '#ffc16b' : '#a34d00' }}
              data-cursor-label="Link"
            >
              A link
            </a>
            <span
              className="rounded-sm px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.1em]"
              style={{
                background: groundIsDark ? 'rgba(255,255,255,.08)' : 'rgba(10,13,19,.06)',
                border: `1px solid ${groundIsDark ? 'rgba(255,255,255,.18)' : 'rgba(10,13,19,.18)'}`,
                color: groundIsDark ? '#c3cbd8' : '#3d4657',
              }}
              data-cursor="custom"
              data-cursor-label="Custom"
            >
              data-cursor
            </span>
          </div>
        </div>

        <p
          className="readout pointer-events-none absolute bottom-3 left-3"
          style={{ color: groundIsDark ? 'rgba(255,255,255,.6)' : 'rgba(10,13,19,.55)' }}
        >
          {mode === 'live' ? 'Move and click inside this panel' : 'Auto-tracing a path'}
        </p>
      </div>
    </section>
  );
}

function Toggle({
  on,
  onClick,
  children,
  disabled,
  title,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      className="pill disabled:cursor-not-allowed disabled:opacity-40"
      data-on={on}
      onClick={onClick}
      aria-pressed={on}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------- style picker */

function StylePicker({
  cfg,
  set,
}: {
  cfg: Config;
  set: <K extends keyof Config>(k: K, v: Config[K]) => void;
}) {
  const [open, setOpen] = useState<CategoryId | null>(
    styleMeta.find((s) => s.id === cfg.style)?.category ?? 'minimal',
  );

  return (
    <aside className="panel flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden lg:sticky lg:top-[4.5rem]">
      <header className="border-b border-rule px-3 py-2">
        <span className="eyebrow">Cursor</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {CATEGORIES.map((cat) => {
          const items = styleMeta.filter((s) => s.category === cat.id);
          const isOpen = open === cat.id;
          return (
            <div key={cat.id} className="border-b border-[var(--rule-soft)]">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : cat.id)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.1em]">
                  {cat.name}
                </span>
                <span className="readout text-dim">
                  {isOpen ? '−' : '+'} {String(items.length).padStart(2, '0')}
                </span>
              </button>
              {isOpen && (
                <ul className="pb-2">
                  {items.map((s) => {
                    const on = s.id === cfg.style;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => set('style', s.id)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[0.82rem] transition-colors"
                          style={{ color: on ? 'var(--signal)' : 'var(--dim)' }}
                        >
                          <span
                            className="h-1 w-1 flex-none rounded-full"
                            style={{ background: on ? 'var(--signal)' : 'transparent' }}
                            aria-hidden="true"
                          />
                          {s.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/* --------------------------------------------------------------- parameters */

function Parameters({
  cfg,
  set,
}: {
  cfg: Config;
  set: <K extends keyof Config>(k: K, v: Config[K]) => void;
}) {
  const [family, setFamily] = useState<FamilyId>(
    effectMeta.find((e) => e.id === cfg.click)?.family ?? 'ripple',
  );

  // Surfaced rather than enforced: you can still override a locked palette, but
  // the panel tells you what you are breaking first.
  const category = styleMeta.find((s) => s.id === cfg.style)?.category;
  const def = category ? categoryDef(category) : null;
  const locked = def?.locked ? def : null;

  return (
    <aside className="panel flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden lg:sticky lg:top-[4.5rem]">
      <header className="border-b border-rule px-3 py-2">
        <span className="eyebrow">Parameters</span>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3">
        <Group label="Click effect">
          <select
            value={family}
            onChange={(e) => setFamily(e.target.value as FamilyId)}
            className="w-full rounded-sm border border-rule bg-[var(--ground)] px-2 py-1.5 font-mono text-[0.72rem] text-ink outline-none focus-visible:border-[var(--signal)]"
          >
            {FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <ul className="mt-2 space-y-0.5">
            {effectMeta
              .filter((e) => e.family === family)
              .map((e) => {
                const on = e.id === cfg.click;
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => set('click', e.id)}
                      className="w-full text-left text-[0.82rem] leading-6 transition-colors"
                      style={{ color: on ? 'var(--signal)' : 'var(--dim)' }}
                    >
                      {on ? '▸ ' : '  '}
                      {e.name}
                    </button>
                  </li>
                );
              })}
          </ul>
        </Group>

        <Group label="Hover">
          <select
            value={cfg.hover}
            onChange={(e) => set('hover', e.target.value)}
            className="w-full rounded-sm border border-rule bg-[var(--ground)] px-2 py-1.5 font-mono text-[0.72rem] text-ink outline-none focus-visible:border-[var(--signal)]"
          >
            {hoverMeta.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[0.74rem] leading-relaxed text-dim">
            {hoverMeta.find((h) => h.id === cfg.hover)?.blurb}
          </p>
        </Group>

        <Group label="Colour">
          {locked?.constraint && (
            <p className="mb-2.5 border-l-2 border-signal pl-2.5 text-[0.74rem] leading-relaxed text-dim">
              {locked.constraint}
            </p>
          )}
          <Palettes
            active={cfg.color}
            category={styleMeta.find((s) => s.id === cfg.style)?.category}
            onPick={(p) => {
              // Two functional updates, so both land even though they are
              // dispatched in the same event.
              set('color', p.color);
              set('color2', p.color2);
            }}
          />
          <div className="mt-3 flex gap-2">
            <Swatch
              label="Primary"
              value={cfg.color}
              onChange={(v) => set('color', v)}
            />
            <Swatch
              label="Accent"
              value={cfg.color2}
              onChange={(v) => set('color2', v)}
            />
          </div>
        </Group>

        <Group label="Geometry">
          <Slider
            label="Size"
            value={cfg.size}
            min={0.4}
            max={3}
            step={0.05}
            onChange={(v) => set('size', v)}
          />
          <Slider
            label="Speed"
            value={cfg.speed}
            min={0.25}
            max={3}
            step={0.05}
            onChange={(v) => set('speed', v)}
          />
          <Slider
            label="Opacity"
            value={cfg.opacity}
            min={0.05}
            max={1}
            step={0.05}
            onChange={(v) => set('opacity', v)}
          />
        </Group>

        <Group label="Blend mode">
          <select
            value={cfg.blend}
            onChange={(e) => set('blend', e.target.value as Config['blend'])}
            className="w-full rounded-sm border border-rule bg-[var(--ground)] px-2 py-1.5 font-mono text-[0.72rem] text-ink outline-none focus-visible:border-[var(--signal)]"
          >
            {BLEND_MODES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[0.74rem] leading-relaxed text-dim">
            {cfg.blend === 'difference'
              ? 'Inverts what is beneath. Legible on any background.'
              : 'Normal compositing. Safest across mixed backgrounds.'}
          </p>
        </Group>

        <button
          type="button"
          onClick={() => {
            (Object.keys(BUILDER_DEFAULT) as Array<keyof Config>).forEach((k) => {
              set(k, BUILDER_DEFAULT[k] as never);
            });
          }}
          className="btn w-full"
        >
          Reset
        </button>
      </div>
    </aside>
  );
}

/**
 * Curated palettes, ordered so the ones tuned for the current style's category
 * come first. Each swatch is split in two because a cursor's accent does as
 * much visual work as its primary, and picking one without seeing the other is
 * how you end up with a trail that vanishes against its own head.
 */
function Palettes({
  active,
  category,
  onPick,
}: {
  active: string;
  category?: CategoryId;
  onPick: (p: Palette) => void;
}) {
  const ordered = useMemo(
    () => (category ? palettesFor(category) : PALETTES),
    [category],
  );

  return (
    <div className="grid grid-cols-6 gap-1.5">
      {ordered.map((p) => {
        const on = p.color.toLowerCase() === active.toLowerCase();
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            title={`${p.name} — ${p.note}`}
            aria-label={p.name}
            aria-pressed={on}
            className="relative h-7 overflow-hidden rounded-sm border transition-colors"
            style={{ borderColor: on ? 'var(--ink)' : 'var(--rule)' }}
          >
            <span
              className="absolute inset-y-0 left-0 w-1/2"
              style={{ background: '#' + p.color }}
            />
            <span
              className="absolute inset-y-0 right-0 w-1/2"
              style={{ background: '#' + p.color2 }}
            />
          </button>
        );
      })}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="eyebrow mb-2">{label}</h3>
      {children}
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-2 block">
      <span className="flex items-baseline justify-between">
        <span className="text-[0.78rem] text-dim">{label}</span>
        <span className="readout tabular-nums text-signal">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Swatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex-1">
      <span className="mb-1 block text-[0.74rem] text-dim">{label}</span>
      <span className="flex items-center gap-1.5 rounded-sm border border-rule bg-[var(--ground)] px-1.5 py-1">
        <input
          type="color"
          value={'#' + value}
          onChange={(e) => onChange(e.target.value.replace('#', ''))}
          className="h-5 w-5 flex-none cursor-pointer border-0 bg-transparent p-0"
          aria-label={`${label} colour`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6);
            onChange(v);
          }}
          className="w-full min-w-0 bg-transparent font-mono text-[0.7rem] uppercase text-ink outline-none"
          aria-label={`${label} hex value`}
          spellCheck={false}
        />
      </span>
    </label>
  );
}
