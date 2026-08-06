'use client';

import { useSearchParams } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';
import {
  CATEGORIES,
  effectMeta,
  styleMeta,
  type CategoryId,
} from '@cursorkit/engine/manifest';
import { StyleCard } from '@/components/style-card';
import { SITE_DEFAULT, type Config } from '@/lib/config';

/** Effects offered alongside the gallery, so a card demo can be re-paired. */
const CLICK_CHOICES = ['ripple-clean', 'shockwave', 'spark-burst', 'ink-splat', 'flash'];

export function ExploreGallery() {
  const params = useSearchParams();
  const initialCategory = params.get('category') as CategoryId | null;

  const [category, setCategory] = useState<CategoryId | 'all'>(
    initialCategory && CATEGORIES.some((c) => c.id === initialCategory) ? initialCategory : 'all',
  );
  const [query, setQuery] = useState('');
  const [click, setClick] = useState(CLICK_CHOICES[0]);
  const [color, setColor] = useState(SITE_DEFAULT.color);

  // Typing should not block the grid re-rendering 66 canvas cards.
  const deferredQuery = useDeferredValue(query);

  const base: Config = useMemo(
    () => ({ ...SITE_DEFAULT, click, color, color2: color }),
    [click, color],
  );

  const shown = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return styleMeta.filter((s) => {
      if (category !== 'all' && s.category !== category) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.includes(q) ||
        s.blurb.toLowerCase().includes(q)
      );
    });
  }, [category, deferredQuery]);

  return (
    <>
      {/* Filter bar sticks under the header so it is always reachable. */}
      <div className="sticky top-14 z-30 border-b border-rule bg-[var(--ground)]/90 backdrop-blur-md">
        <div className="shell flex flex-col gap-3 py-3">
          <div className="flex items-center gap-3">
            <label className="flex flex-1 items-center gap-2.5 border-b border-rule py-1.5 focus-within:border-[var(--signal)]">
              <span className="eyebrow">Search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ring, trail, neon…"
                className="w-full bg-transparent font-mono text-sm text-ink outline-none placeholder:text-dim"
                type="search"
              />
            </label>

            <span className="readout flex-none tabular-nums text-dim">
              {String(shown.length).padStart(2, '0')} / {styleMeta.length}
            </span>
          </div>

          <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              className="pill"
              data-on={category === 'all'}
              onClick={() => setCategory('all')}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="pill"
                data-on={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.name}
              </button>
            ))}

            <span className="mx-2 h-4 w-px flex-none bg-[var(--rule)]" aria-hidden="true" />

            <label className="flex flex-none items-center gap-2">
              <span className="eyebrow">Click</span>
              <select
                value={click}
                onChange={(e) => setClick(e.target.value)}
                className="rounded-sm border border-rule bg-[var(--panel)] px-2 py-1 font-mono text-[0.7rem] text-ink outline-none focus-visible:border-[var(--signal)]"
              >
                {CLICK_CHOICES.map((id) => (
                  <option key={id} value={id}>
                    {effectMeta.find((e) => e.id === id)?.name ?? id}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-none items-center gap-2">
              <span className="eyebrow">Colour</span>
              <input
                type="color"
                value={'#' + color}
                onChange={(e) => setColor(e.target.value.replace('#', ''))}
                className="h-6 w-9 cursor-pointer rounded-sm border border-rule bg-transparent p-0.5"
                aria-label="Preview colour"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="shell py-10">
        {shown.length === 0 ? (
          <div className="panel px-6 py-16 text-center">
            <p className="text-lg">Nothing matches “{query}”.</p>
            <p className="mt-2 text-sm text-dim">
              Try a category instead, or search for a shape — ring, arrow, blob, spark.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((meta, i) => (
              <StyleCard key={meta.id} meta={meta} base={base} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
