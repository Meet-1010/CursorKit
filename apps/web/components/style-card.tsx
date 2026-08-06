'use client';

import Link from 'next/link';
import { useState } from 'react';
import { categoryDef, type StyleMeta } from '@cursorkit/engine/manifest';
import { PreviewCanvas } from '@/components/preview-canvas';
import { useSiteCursor } from '@/components/site-cursor';
import { useInView } from '@/lib/use-in-view';
import { toQuery, type Config } from '@/lib/config';

/**
 * One style in the gallery.
 *
 * Two demonstrations at once: the card runs a scripted pointer so the style
 * animates on its own, and hovering the card retargets the *page* cursor to the
 * same configuration — so you evaluate it with your own hand before committing.
 */
export function StyleCard({
  meta,
  base,
  index,
}: {
  meta: StyleMeta;
  base: Config;
  index: number;
}) {
  const { ref, inView } = useInView<HTMLElement>();
  const { preview } = useSiteCursor();
  const [hot, setHot] = useState(false);

  const def = categoryDef(meta.category);

  // A design language whose palette is part of its technique ignores the
  // gallery's colour picker. Neumorphism drawn in the visitor's accent is not
  // neumorphism at all — it is a coloured blob with invisible shadows.
  const cfg: Config = {
    ...base,
    style: meta.id,
    blend: meta.blend ?? base.blend,
    ...(def.locked ? def.palette : null),
  };

  const take = () => {
    setHot(true);
    preview(cfg);
  };
  const release = () => {
    setHot(false);
    preview(null);
  };

  return (
    <article
      ref={ref}
      className="card flex flex-col"
      onPointerEnter={take}
      onPointerLeave={release}
      onFocus={take}
      onBlur={release}
    >
      {/* Each language gets the ground it was designed for. Glass is previewed
          over a gradient because a blur with nothing behind it shows nothing,
          and brutalism over paper because a black keyline needs a light page. */}
      <div className="relative h-52" style={{ background: def.surface }}>
        {inView ? (
          <PreviewCanvas config={cfg} mode="scripted" seed={index + 1} />
        ) : null}

        <span
          aria-hidden="true"
          className="readout pointer-events-none absolute left-3 top-3 text-dim transition-opacity"
          style={{ opacity: hot ? 1 : 0 }}
        >
          ON PAGE
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-rule p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[1.02rem] font-semibold leading-tight">{meta.name}</h3>
          <span className="readout flex-none text-dim">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <p className="text-[0.82rem] leading-relaxed text-dim">{meta.blurb}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <code className="readout truncate text-dim">{meta.id}</code>
          <Link
            href={`/builder?${toQuery(cfg)}`}
            className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-signal transition-opacity hover:opacity-70"
            data-cursor-label="Open"
          >
            Use this →
          </Link>
        </div>
      </div>
    </article>
  );
}
