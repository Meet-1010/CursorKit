import type { Metadata } from 'next';
import Link from 'next/link';
import { EFFECT_COUNT, STYLE_COUNT, hoverMeta } from '@cursorkit/engine/manifest';
import { CopyLine } from '@/components/copy-line';
import { SITE_ORIGIN } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Docs',
  description: 'Install CursorKit, configure it by URL, and control it per element.',
};

const PARAMS: Array<[string, string, string, string]> = [
  ['style', 'string', 'dot-ring', `Cursor shape. One of ${STYLE_COUNT} ids.`],
  ['click', 'string', 'ripple-clean', `Click effect. One of ${EFFECT_COUNT} ids.`],
  ['hover', 'string', 'scale-expand', 'How the cursor reacts to interactive elements.'],
  ['color', 'hex', 'ffffff', 'Primary colour, without the leading #.'],
  ['color2', 'hex', '= color', 'Accent colour, used by trails and particles.'],
  ['size', '0.4 – 3', '1', 'Size multiplier.'],
  ['speed', '0.25 – 3', '1', 'Animation speed multiplier.'],
  ['opacity', '0.05 – 1', '1', 'Overall cursor opacity.'],
  ['blend', 'string', 'normal', 'CSS mix-blend-mode for the overlay.'],
  ['dark', '0 | 1', '1', 'Hints that the host page is dark.'],
  ['adapt', '0 | 1', '1', 'Keep the cursor legible against whatever it is over. Set 0 to pin your exact colour.'],
  ['motion', 'full', '—', 'Set to `full` to ignore the reduced-motion preference.'],
  ['ignore', 'selector', '—', 'Elements that keep the native cursor.'],
  ['z', 'integer', '2147483000', 'z-index of the overlay canvas.'],
];

const ATTRS: Array<[string, string]> = [
  ['data-cursor="native"', 'Restores the operating system cursor over this element.'],
  ['data-cursor="text"', 'Treats the element as text, whatever its tag.'],
  ['data-cursor="button"', 'Treats the element as interactive.'],
  ['data-cursor="image"', 'Treats the element as media.'],
  ['data-cursor="anything-else"', 'Marks a custom target, and doubles as its label.'],
  ['data-cursor-label="View"', 'Overrides the automatically detected label.'],
  ['data-cursor-color="#ff0055"', 'Overrides the cursor colour while hovering this element.'],
];

/** Precedence for the label the cursor shows, highest first. */
const LABEL_ORDER: Array<[string, string]> = [
  ['data-cursor-label', 'Your explicit override. Always wins.'],
  ['aria-label', 'What the element already announces itself as.'],
  ['aria-labelledby', 'Resolved and joined, same as a screen reader would.'],
  ['title', 'The native tooltip text.'],
  ['alt', 'For images, or an image inside the element.'],
  ['placeholder', 'For inputs with no other name.'],
  ['visible text', 'Trimmed and truncated on a word boundary at 28 characters.'],
  ['the element type', '“Link”, “Button”, “View”, “Type” — so a label is never empty.'],
];

export default function DocsPage() {
  return (
    <>
      <section className="border-b border-rule">
        <div className="shell py-16">
          <p className="section-label eyebrow">Documentation</p>
          <h1 className="mt-5 max-w-[18ch] text-[clamp(2.2rem,5vw,3.6rem)]">
            Paste one line. That is the install.
          </h1>
        </div>
      </section>

      <div className="shell grid gap-14 py-14 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-20">
        <article className="min-w-0 space-y-16">
          <Section id="install" title="Install">
            <p>
              Drop the tag anywhere in your HTML — <code className="inline-code">head</code>{' '}
              or the end of <code className="inline-code">body</code>, it makes no
              difference. The script waits for the document before it draws
              anything.
            </p>
            <CopyLine value={`<script src="${SITE_ORIGIN}/embed.js?style=magnetic-blob&click=shockwave&color=ff00ff"></script>`} />
            <p>
              The response is assembled per configuration: you get the engine
              core plus only the style and effect you named, which is typically
              under 10kb gzipped. Nothing else is downloaded and there is no
              build step to add.
            </p>
          </Section>

          <Section id="params" title="URL parameters">
            <p>
              Every option is a query parameter. Values are clamped and
              validated server-side and again in the browser, so a bad value
              degrades to the default rather than breaking your page.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule">
                    {['Parameter', 'Type', 'Default', 'Meaning'].map((h) => (
                      <th key={h} className="eyebrow py-2 pr-4 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PARAMS.map(([name, type, def, note]) => (
                    <tr key={name} className="border-b border-[var(--rule-soft)]">
                      <td className="py-2.5 pr-4">
                        <code className="readout text-signal">{name}</code>
                      </td>
                      <td className="readout py-2.5 pr-4 text-dim">{type}</td>
                      <td className="readout py-2.5 pr-4 text-dim">{def}</td>
                      <td className="py-2.5 text-sm leading-relaxed text-dim">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-dim">
              You can also set any parameter as a <code className="inline-code">data-</code>
              attribute on the script tag. Attributes win over query
              parameters, which makes server-side templating easier.
            </p>
          </Section>

          <Section id="per-element" title="Per-element control">
            <p>
              The cursor classifies what it is over automatically — links,
              buttons, inputs, and media all get sensible treatment with no
              markup from you. When you want something specific, annotate the
              element.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <tbody>
                  {ATTRS.map(([attr, note]) => (
                    <tr key={attr} className="border-b border-[var(--rule-soft)]">
                      <td className="py-2.5 pr-6 align-top">
                        <code className="readout whitespace-nowrap text-signal">{attr}</code>
                      </td>
                      <td className="py-2.5 text-sm leading-relaxed text-dim">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="labels" title="Labels write themselves">
            <p>
              Any transform that shows a label — <code className="inline-code">label</code>,{' '}
              <code className="inline-code">label-chip</code>,{' '}
              <code className="inline-code">caption</code>,{' '}
              <code className="inline-code">typewriter</code> — reads the text
              off the element itself. A button that says “Add to cart” shows
              “Add to cart”. You do not annotate anything.
            </p>
            <p>
              The order below mirrors how a screen reader computes an accessible
              name, for the same reason: it is what the element genuinely calls
              itself. Markup that is good for assistive technology is markup that
              labels well here, and vice versa.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <tbody>
                  {LABEL_ORDER.map(([source, note], i) => (
                    <tr key={source} className="border-b border-[var(--rule-soft)]">
                      <td className="readout w-12 py-2.5 pr-3 align-top text-dim">
                        {i + 1}
                      </td>
                      <td className="py-2.5 pr-6 align-top">
                        <code className="readout whitespace-nowrap text-signal">{source}</code>
                      </td>
                      <td className="py-2.5 text-sm leading-relaxed text-dim">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-dim">
              Elements marked <code className="inline-code">data-cursor=&quot;native&quot;</code>{' '}
              are skipped entirely — they get no label and no cursor.
            </p>
          </Section>

          <Section id="adapt" title="It reads the page and adapts">
            <p>
              The most common way a custom cursor fails is not ugliness — it is
              a white cursor crossing onto a white hero and disappearing. No
              style can solve that on its own, because a style cannot know what
              it is over.
            </p>
            <p>
              So the engine reads the page underneath the pointer and shifts the
              cursor colour until it has at least 3:1 contrast against it. Only
              lightness moves; hue and saturation are kept. Your magenta stays
              magenta — it just gets lighter or darker so it can still be seen.
            </p>
            <ul className="space-y-3">
              {[
                ['How it reads', 'elementFromPoint, then a walk up the ancestors compositing every translucent background until it hits an opaque one. Computed styles, not pixels — no screen capture, no permission prompt, no 200kb dependency.'],
                ['Over images and gradients', 'It says so rather than guessing. Styles that care fall back; the rest keep your configured colour.'],
                ['Cost', 'Throttled to roughly ten reads a second, and only when the pointer has actually travelled. The contrast solve is cached on the colour pair.'],
                ['Turning it off', 'adapt=0 pins your exact colour. Worth it when the cursor is part of a fixed brand treatment and you control the backgrounds.'],
              ].map(([head, body]) => (
                <li key={head} className="flex flex-col gap-1 border-b border-[var(--rule-soft)] pb-3 sm:flex-row sm:gap-6">
                  <span className="w-44 flex-none text-sm text-ink">{head}</span>
                  <span className="text-sm leading-relaxed text-dim">{body}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-dim">
              The neumorphic styles take this further and use the sampled colour
              as their own fill, because soft UI only works when the shape
              matches the surface it sits on. That is what lets them work on any
              page rather than one exact background.
            </p>
          </Section>


          <Section id="hover" title="Hover transforms">
            <p>
              A hover transform composes with any style rather than replacing
              it, which is why the combination count is what it is.
            </p>
            <dl className="space-y-0">
              {hoverMeta.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-col gap-1 border-b border-[var(--rule-soft)] py-3 sm:flex-row sm:gap-6"
                >
                  <dt className="readout w-40 flex-none text-signal">{h.id}</dt>
                  <dd className="text-sm leading-relaxed text-dim">{h.blurb}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="api" title="Runtime API">
            <p>
              The script publishes a small global. Use it to change the cursor
              after load — on a theme switch, or per route.
            </p>
            <pre className="code">
              <code>{`CursorKit.update({ style: 'comet', color: '00ffcc' });
CursorKit.destroy();                  // restore the native cursor
CursorKit.boot({ style: 'dot-ring' }); // start again

CursorKit.engine        // the live Engine instance, or null
CursorKit.allStyles()   // every style loaded in this bundle`}</code>
            </pre>
            <p className="text-sm text-dim">
              A per-config embed only contains the style and effect you asked
              for. To switch between many at runtime, load{' '}
              <code className="inline-code">/embed.full.js</code> instead — the
              whole library in one file.
            </p>
          </Section>

          <Section id="frameworks" title="Frameworks">
            <div className="space-y-6">
              <Framework
                name="Next.js — App Router"
                code={`// app/layout.tsx
import Script from 'next/script';

<Script
  src="${SITE_ORIGIN}/embed.js?style=dot-ring&color=ffffff"
  strategy="afterInteractive"
/>`}
              />
              <Framework
                name="React — Vite or CRA"
                code={`// index.html, before </body>
<script src="${SITE_ORIGIN}/embed.js?style=goo&click=ink-splat"></script>`}
              />
              <Framework
                name="Webflow / Squarespace / WordPress"
                code={`Paste into the custom-code or header-injection field:

<script src="${SITE_ORIGIN}/embed.js?style=ribbon&color=ff8a3d"></script>`}
              />
            </div>
          </Section>

          <Section id="behaviour" title="What it does on its own">
            <ul className="space-y-3">
              {[
                ['Touch devices', 'The script exits before drawing and leaves the native cursor alone. Nothing is hidden and no canvas is created.'],
                ['Reduced motion', 'Trails, particles and magnetism are dropped; the cursor shape stays. Override with motion=full if your use case genuinely needs it.'],
                ['Background tabs', 'The render loop stops on visibilitychange and restarts with a fresh clock, so returning to a tab never plays a backlog of frames.'],
                ['Errors', 'If a style throws, the engine tears itself down and restores the native cursor. A visitor is never left without a pointer.'],
              ].map(([head, body]) => (
                <li key={head} className="flex flex-col gap-1 border-b border-[var(--rule-soft)] pb-3 sm:flex-row sm:gap-6">
                  <span className="w-40 flex-none text-sm text-ink">{head}</span>
                  <span className="text-sm leading-relaxed text-dim">{body}</span>
                </li>
              ))}
            </ul>
          </Section>
        </article>

        <nav className="hidden lg:block" aria-label="On this page">
          <div className="sticky top-24">
            <p className="eyebrow">On this page</p>
            <ul className="mt-4 space-y-2">
              {[
                ['install', 'Install'],
                ['params', 'URL parameters'],
                ['per-element', 'Per-element control'],
                ['labels', 'Automatic labels'],
                ['adapt', 'Reading the page'],
                ['hover', 'Hover transforms'],
                ['api', 'Runtime API'],
                ['frameworks', 'Frameworks'],
                ['behaviour', 'Built-in behaviour'],
              ].map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="text-sm text-dim transition-colors hover:text-ink"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <Link href="/builder" className="btn btn-signal mt-8 w-full">
              Open the builder
            </Link>
            <Link href="/dashboard" className="btn mt-2 w-full">
              Embed the builder
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="border-b border-rule pb-3 text-2xl">{title}</h2>
      <div className="mt-6 space-y-5 text-[0.95rem] leading-relaxed text-dim [&_p]:max-w-[62ch]">
        {children}
      </div>
    </section>
  );
}

function Framework({ name, code }: { name: string; code: string }) {
  return (
    <div>
      <h3 className="mb-2 font-mono text-[0.74rem] uppercase tracking-[0.1em] text-ink">
        {name}
      </h3>
      <pre className="code">
        <code>{code}</code>
      </pre>
    </div>
  );
}
