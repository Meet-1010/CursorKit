import Link from 'next/link';
import {
  CATEGORIES,
  COMBINATIONS,
  EFFECT_COUNT,
  HOVER_COUNT,
  PALETTE_COUNT,
  STYLE_COUNT,
  categorySurface,
  styleMeta,
  type CategoryId,
} from '@cursorkit/engine/manifest';
import { CopyLine } from '@/components/copy-line';
import { PreviewCanvas } from '@/components/preview-canvas';
import { Telemetry } from '@/components/telemetry';
import { TryRail, type TryOption } from '@/components/try-rail';
import { SITE_DEFAULT, embedTag, type Config } from '@/lib/config';

/** Six styles that between them show lag, physics, particles, and instrument work. */
const TRY: TryOption[] = [
  { label: 'Dot & Ring', cfg: { style: 'dot-ring', click: 'ripple-clean' } },
  {
    label: 'Soft UI',
    cfg: { style: 'neu-dimple', click: 'soft-press', hover: 'label-chip' },
  },
  { label: 'Magnetic Blob', cfg: { style: 'magnetic-blob', click: 'shockwave', hover: 'magnet' } },
  { label: 'Comet', cfg: { style: 'comet', click: 'flash', color: 'ff8a3d', color2: 'ffdca8' } },
  {
    label: 'Brutalist',
    cfg: { style: 'bru-slab', click: 'hard-stamp', hover: 'hard-shadow', color: 'ffd23f', color2: 'ff5c5c' },
  },
  { label: 'Sparks', cfg: { style: 'particle-sparks', click: 'spark-burst' } },
  { label: 'Targeting', cfg: { style: 'targeting-system', click: 'crosshair-lock', hover: 'outline' } },
  { label: 'Inversion', cfg: { style: 'inverted-circle', click: 'ripple-fill', blend: 'difference' } },
];

/**
 * Four styles, one per visual temperament. Each carries its category so the
 * card gets the ground that language needs — brutalism over paper, soft UI
 * over its own exact grey, additive particles over near-black.
 */
const SHOWCASE: Array<{ cfg: Config; caption: string; category: CategoryId }> = [
  {
    cfg: { ...SITE_DEFAULT, style: 'ribbon', click: 'ink-splat', color: 'ffa132', color2: 'ff6b35' },
    caption: 'Ribbon · tapered trail',
    category: 'trail',
  },
  {
    cfg: { ...SITE_DEFAULT, style: 'neu-well', click: 'soft-press', color: 'e0e5ec', color2: 'a3b1c6' },
    caption: 'Well · soft UI',
    category: 'neumorphic',
  },
  {
    cfg: { ...SITE_DEFAULT, style: 'neon-trail', click: 'portal-open', color: 'ff4d9d', color2: '9b5cff' },
    caption: 'Neon · additive light',
    category: 'particle',
  },
  {
    cfg: { ...SITE_DEFAULT, style: 'bru-slab', click: 'hard-stamp', color: 'ffd23f', color2: 'ff5c5c' },
    caption: 'Slab · brutalist',
    category: 'brutalist',
  },
];

export default function HomePage() {
  const tag = embedTag({
    ...SITE_DEFAULT,
    style: 'magnetic-blob',
    click: 'shockwave',
    hover: 'magnet',
    color: 'ff00ff',
    size: 1.2,
  });

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden border-b border-rule">
        <div className="graticule" aria-hidden="true" />

        <div className="shell relative flex min-h-[min(84vh,52rem)] flex-col justify-center py-24">
          <p className="eyebrow anim-rise">
            Cursor as a service · v0.1
          </p>

          <h1
            className="anim-rise display-wide mt-6 max-w-[15ch] text-[clamp(2.9rem,8.4vw,7rem)] leading-[0.94]"
            style={{ animationDelay: '60ms' }}
          >
            The pointer is
            <br />
            the interface.
          </h1>

          <p
            className="anim-rise mt-8 max-w-[52ch] text-lg leading-relaxed text-dim"
            style={{ animationDelay: '140ms' }}
          >
            {STYLE_COUNT} hand-built cursor styles across ten categories,{' '}
            {EFFECT_COUNT} click effects, and {HOVER_COUNT} hover transforms —
            rendered at 60fps, in a script tag you paste once.{' '}
            <span className="text-ink">
              You are using it right now.
            </span>
          </p>

          <div className="anim-rise mt-10 max-w-2xl" style={{ animationDelay: '200ms' }}>
            <TryRail options={TRY} />
          </div>

          <div
            className="anim-rise mt-12 flex flex-wrap items-center gap-3"
            style={{ animationDelay: '260ms' }}
          >
            <Link href="/builder" className="btn btn-signal">
              Open the builder
            </Link>
            <Link href="/explore" className="btn">
              Browse {STYLE_COUNT} styles
            </Link>
          </div>

          {/* Telemetry docks bottom-left like an instrument panel, not centred. */}
          <div className="anim-rise mt-16 max-w-xs" style={{ animationDelay: '340ms' }}>
            <Telemetry />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- install */}
      <section className="border-b border-rule">
        <div className="shell grid gap-10 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
          <div>
            <p className="section-label eyebrow">Install</p>
            <h2 className="mt-5 max-w-[16ch] text-[clamp(1.9rem,3.4vw,2.9rem)]">
              One line. No npm, no build step.
            </h2>
            <p className="mt-5 max-w-[46ch] leading-relaxed text-dim">
              Works on React, Next, plain HTML, WordPress, Webflow — anything
              that can load a script. The embed reads its own query string, so
              your configuration lives in the URL and nothing else changes.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                ['Under 12kb', 'gzipped for any one configuration'],
                ['Zero dependencies', 'vanilla canvas, no framework'],
                ['Auto-disables', 'on touch devices and reduced motion'],
              ].map(([head, tail]) => (
                <li key={head} className="flex gap-3 border-b border-[var(--rule-soft)] pb-3">
                  <span className="mt-[0.45rem] h-px w-4 flex-none bg-signal" aria-hidden="true" />
                  <span className="text-sm leading-relaxed">
                    <span className="text-ink">{head}</span>{' '}
                    <span className="text-dim">— {tail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <CopyLine value={tag} />
        </div>
      </section>

      {/* ------------------------------------------------------ showcase */}
      <section className="border-b border-rule">
        <div className="shell py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="section-label eyebrow">Range</p>
              <h2 className="mt-5 max-w-[18ch] text-[clamp(1.9rem,3.4vw,2.9rem)]">
                Every style is built by hand, not generated.
              </h2>
            </div>
            <p className="max-w-[34ch] text-sm leading-relaxed text-dim">
              Ten categories, from a hairline ring you barely notice to
              additive neon that lights the page. Each one is a module — the
              engine loads only what you ask for.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE.map((s) => (
              <figure key={s.caption} className="card">
                {/* The ground comes from the style's own category — a
                    brutalist keyline over dark has nothing to read against,
                    and soft UI needs the page to be its own colour. */}
                <div
                  className="relative h-56"
                  style={{ background: categorySurface(s.category) }}
                >
                  <PreviewCanvas config={s.cfg} mode="scripted" seed={s.caption.length} />
                </div>
                <figcaption className="readout border-t border-rule px-3 py-2.5 text-dim">
                  {s.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ categories */}
      <section className="border-b border-rule">
        <div className="shell py-20">
          <p className="section-label eyebrow">Categories</p>
          <div className="mt-10 grid gap-x-10 gap-y-0 sm:grid-cols-2">
            {CATEGORIES.map((cat) => {
              const count = styleMeta.filter((s) => s.category === cat.id).length;
              return (
                <Link
                  key={cat.id}
                  href={`/explore?category=${cat.id}`}
                  className="group flex items-baseline justify-between gap-6 border-b border-rule py-5 transition-colors hover:border-[var(--dim)]"
                >
                  <span className="flex min-w-0 items-baseline gap-4">
                    <span className="text-xl transition-colors group-hover:text-signal">
                      {cat.name}
                    </span>
                    <span className="truncate text-sm text-dim">{cat.note}</span>
                  </span>
                  <span className="readout flex-none tabular-nums text-dim">
                    {String(count).padStart(2, '0')}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ close */}
      <section>
        <div className="shell py-24 text-center">
          <p className="readout text-dim">
            {STYLE_COUNT} styles × {EFFECT_COUNT} effects × {HOVER_COUNT} hover
            transforms · {PALETTE_COUNT} curated palettes
          </p>
          <p className="display-wide mt-6 text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.95]">
            {COMBINATIONS.toLocaleString('en-US')}
            <br />
            <span className="text-dim">working combinations.</span>
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/builder" className="btn btn-signal">
              Build yours
            </Link>
            <Link href="/docs" className="btn">
              Read the docs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
