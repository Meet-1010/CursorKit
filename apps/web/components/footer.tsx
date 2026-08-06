import Link from 'next/link';
import { EFFECT_COUNT, HOVER_COUNT, STYLE_COUNT } from '@cursorkit/engine/manifest';

export function Footer() {
  return (
    <footer className="mt-32 border-t border-rule">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-mono text-[0.78rem] font-semibold tracking-[0.14em] text-ink">
            CURSORKIT
          </p>
          <p className="mt-3 max-w-[28ch] text-sm leading-relaxed text-dim">
            One script tag. Every cursor. Built for people who care what the
            pointer does.
          </p>
        </div>

        <FooterList
          title="Product"
          links={[
            { href: '/explore', label: 'Explore styles' },
            { href: '/builder', label: 'Builder' },
            { href: '/showcase', label: 'Showcase' },
          ]}
        />
        <FooterList
          title="Develop"
          links={[
            { href: '/docs', label: 'Documentation' },
            { href: '/docs#params', label: 'URL parameters' },
            { href: '/docs#per-element', label: 'Per-element control' },
            { href: '/docs#frameworks', label: 'Framework guides' },
          ]}
        />

        <div>
          <p className="eyebrow">Library</p>
          <dl className="mt-4 space-y-2">
            <Stat label="Cursor styles" value={STYLE_COUNT} />
            <Stat label="Click effects" value={EFFECT_COUNT} />
            <Stat label="Hover transforms" value={HOVER_COUNT} />
          </dl>
        </div>
      </div>

      <div className="shell flex flex-wrap items-center justify-between gap-3 border-t border-rule py-5">
        <p className="readout text-dim">
          Rendered on canvas · zero dependencies · 60fps target
        </p>
        <p className="readout text-dim">© {new Date().getFullYear()} CursorKit</p>
      </div>
    </footer>
  );
}

function FooterList({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="text-sm text-dim transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--rule-soft)] pb-1.5">
      <dt className="text-sm text-dim">{label}</dt>
      <dd className="readout tabular-nums text-signal">{value}</dd>
    </div>
  );
}
