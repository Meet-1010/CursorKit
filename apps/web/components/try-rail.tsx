'use client';

import { useState } from 'react';
import { useSiteCursor } from '@/components/site-cursor';
import type { Config } from '@/lib/config';

export interface TryOption {
  label: string;
  cfg: Partial<Config>;
}

/**
 * The hero's thesis, made operable: hovering a chip retargets the page's own
 * cursor to that configuration, so the demo is the visitor's own hand. Clicking
 * pins it, which matters on trackpads where you cannot hover and move at once.
 */
export function TryRail({ options }: { options: TryOption[] }) {
  const { preview, active } = useSiteCursor();
  const [pinned, setPinned] = useState<number | null>(null);

  if (!active) {
    return (
      <p className="readout text-dim">
        Pointer required — open this on a desktop to try the cursors live.
      </p>
    );
  }

  const apply = (i: number | null) => preview(i === null ? null : options[i].cfg);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow mr-1">Try it</span>
      {options.map((o, i) => (
        <button
          key={o.label}
          type="button"
          className="pill"
          data-on={pinned === i}
          onPointerEnter={() => apply(i)}
          onPointerLeave={() => apply(pinned)}
          onFocus={() => apply(i)}
          onBlur={() => apply(pinned)}
          onClick={() => {
            const next = pinned === i ? null : i;
            setPinned(next);
            apply(next);
          }}
          aria-pressed={pinned === i}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
