'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/explore', label: 'Explore' },
  { href: '/builder', label: 'Builder' },
  { href: '/dashboard', label: 'Embed' },
  { href: '/showcase', label: 'Showcase' },
  { href: '/docs', label: 'Docs' },
];

export function Header() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-[var(--ground)]/85 backdrop-blur-md">
      <div className="shell flex h-14 items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="CursorKit home">
          <Mark />
          <span className="font-mono text-[0.8rem] font-semibold tracking-[0.14em] text-ink">
            CURSORKIT
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main">
          {NAV.map((item) => {
            const on = path === item.href || path.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? 'page' : undefined}
                className="relative px-3 py-2 font-mono text-[0.72rem] uppercase tracking-[0.1em] transition-colors"
                style={{ color: on ? 'var(--ink)' : 'var(--dim)' }}
              >
                {item.label}
                {on && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-px h-px bg-signal"
                  />
                )}
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

/** The logo is a reticle — the same corner-bracket language the cursors use. */
function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M1 5.5V1h4.5M12.5 1H17v4.5M17 12.5V17h-4.5M5.5 17H1v-4.5"
        stroke="var(--signal)"
        strokeWidth="1.4"
      />
      <circle cx="9" cy="9" r="2.4" fill="var(--ink)" />
    </svg>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = (() => {
      try {
        return localStorage.getItem('ck_theme');
      } catch {
        return null;
      }
    })();
    if (stored === 'light') setTheme('light');
  }, []);

  const flip = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('ck_theme', next);
    } catch {
      /* private mode — the choice just will not persist */
    }
  };

  return (
    <button
      type="button"
      onClick={flip}
      className="ml-2 flex h-8 w-8 items-center justify-center rounded-sm border border-rule text-dim transition-colors hover:border-[var(--dim)] hover:text-ink"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        {theme === 'dark' ? (
          <path
            d="M11.5 8.4A5 5 0 0 1 5.6 2.5a5 5 0 1 0 5.9 5.9Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        ) : (
          <>
            <circle cx="7" cy="7" r="2.8" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M7 .8v1.6M7 11.6v1.6M13.2 7h-1.6M2.4 7H.8M11.4 2.6 10.3 3.7M3.7 10.3l-1.1 1.1M11.4 11.4l-1.1-1.1M3.7 3.7 2.6 2.6"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </button>
  );
}
