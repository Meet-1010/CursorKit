import type { Metadata } from 'next';
import Link from 'next/link';
import { STYLE_COUNT } from '@cursorkit/engine/manifest';
import { CopyLine } from '@/components/copy-line';
import { SITE_ORIGIN } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Embedded dashboard',
  description:
    'Put the CursorKit builder inside your own site so your team can change the cursor without touching code.',
};

const OPTIONS: Array<[string, string, string]> = [
  ['persist', '0 | 1', 'Store the choice in the browser and re-apply it next load.'],
  ['position', 'corner', 'bottom-right (default), bottom-left, top-right, top-left.'],
  ['panel', 'hidden', 'Hide the launcher and open it yourself from your own UI.'],
  ['accent', 'hex', 'Accent colour for the panel chrome, without the leading #.'],
  ['origin', 'url', 'Origin used in the copyable tag. Defaults to where the script came from.'],
];

export default function DashboardPage() {
  return (
    <>
      <section className="border-b border-rule">
        <div className="shell py-16">
          <p className="section-label eyebrow">Embedded dashboard</p>
          <h1 className="mt-5 max-w-[20ch] text-[clamp(2.2rem,5vw,3.6rem)]">
            Put the builder inside your own site.
          </h1>
          <p className="mt-5 max-w-[58ch] leading-relaxed text-dim">
            One more script tag mounts the whole builder into your page — all{' '}
            {STYLE_COUNT} styles, every effect, the palettes, the sliders. Your
            designer changes the cursor on the real site, on real content, and
            copies the tag when it is right. No deploy in the loop.
          </p>
        </div>
      </section>

      <div className="shell grid gap-14 py-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <article className="min-w-0 space-y-14">
          <section>
            <h2 className="border-b border-rule pb-3 text-2xl">Install</h2>
            <div className="mt-6 space-y-5">
              <p className="max-w-[62ch] leading-relaxed text-dim">
                Add it alongside your embed tag, or instead of it — the dashboard
                boots a cursor of its own, so you do not need both while you are
                still choosing.
              </p>
              <CopyLine
                value={`<script src="${SITE_ORIGIN}/dashboard.js?persist=1"></script>`}
                label="Dashboard tag"
              />
              <p className="max-w-[62ch] leading-relaxed text-dim">
                A launcher appears in the corner. Open it, pick a cursor, and the
                page updates as you go — you are previewing on your own content,
                not on a demo canvas.
              </p>
            </div>
          </section>

          <section>
            <h2 className="border-b border-rule pb-3 text-2xl">Two ways to finish</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="panel p-5">
                <p className="eyebrow">Copy tag</p>
                <p className="mt-3 text-sm leading-relaxed text-dim">
                  Takes the configuration as a normal embed tag. Paste it into
                  your template, drop the dashboard, and every visitor gets that
                  cursor from a ~10kb file.
                </p>
                <p className="mt-3 text-sm text-ink">Use this for production.</p>
              </div>
              <div className="panel p-5">
                <p className="eyebrow">Save for this site</p>
                <p className="mt-3 text-sm leading-relaxed text-dim">
                  Stores the choice in <code className="inline-code">localStorage</code>{' '}
                  and re-applies it on the next load. It follows the browser, not
                  the site, so it is per-person.
                </p>
                <p className="mt-3 text-sm text-ink">Use this while deciding.</p>
              </div>
            </div>
            <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-dim">
              That distinction matters and the panel says so in its own footer:
              saving is not publishing. If you want everyone to see the cursor,
              the tag is the only thing that does it.
            </p>
          </section>

          <section>
            <h2 className="border-b border-rule pb-3 text-2xl">Options</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule">
                    {['Parameter', 'Values', 'Meaning'].map((h) => (
                      <th key={h} className="eyebrow py-2 pr-4 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OPTIONS.map(([name, values, note]) => (
                    <tr key={name} className="border-b border-[var(--rule-soft)]">
                      <td className="py-2.5 pr-4">
                        <code className="readout text-signal">{name}</code>
                      </td>
                      <td className="readout py-2.5 pr-4 text-dim">{values}</td>
                      <td className="py-2.5 text-sm leading-relaxed text-dim">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="border-b border-rule pb-3 text-2xl">Open it from your own UI</h2>
            <div className="mt-6 space-y-5">
              <p className="max-w-[62ch] leading-relaxed text-dim">
                With <code className="inline-code">panel=hidden</code> the
                launcher never renders and you control the panel yourself — an
                item in your admin menu, a keyboard shortcut, whatever fits.
              </p>
              <pre className="code">
                <code>{`<script src="${SITE_ORIGIN}/dashboard.js?panel=hidden"></script>

<button onclick="CursorKit.dashboard.open()">Cursor settings</button>`}</code>
              </pre>
            </div>
          </section>

          <section>
            <h2 className="border-b border-rule pb-3 text-2xl">What it will not do</h2>
            <ul className="mt-6 space-y-3">
              {[
                [
                  'It is not small',
                  'The dashboard carries the whole library, because switching styles at runtime is its entire job. Do not ship it to visitors — ship the tag it produces.',
                ],
                [
                  'It will not restyle your page',
                  'The panel renders in a shadow root with its own reset, so your CSS cannot reach it and it cannot reach your CSS.',
                ],
                [
                  'It keeps its own cursor native',
                  'The panel is marked data-cursor="native". Choosing a cursor is harder when the tool is wearing it.',
                ],
              ].map(([head, body]) => (
                <li
                  key={head}
                  className="flex flex-col gap-1 border-b border-[var(--rule-soft)] pb-3 sm:flex-row sm:gap-6"
                >
                  <span className="w-48 flex-none text-sm text-ink">{head}</span>
                  <span className="text-sm leading-relaxed text-dim">{body}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-5">
            <p className="eyebrow">Try it here</p>
            <p className="mt-3 text-sm leading-relaxed text-dim">
              This site runs the builder as a page rather than a panel — same
              controls, more room. The embedded version is the same thing folded
              into a corner of yours.
            </p>
            <Link href="/builder" className="btn btn-signal mt-5 w-full">
              Open the builder
            </Link>
            <Link href="/docs" className="btn mt-2 w-full">
              Embed reference
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
