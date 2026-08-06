'use client';

import Link from 'next/link';
import { PreviewCanvas } from '@/components/preview-canvas';
import { useSiteCursor } from '@/components/site-cursor';
import { useInView } from '@/lib/use-in-view';
import { toQuery, type Config } from '@/lib/config';

export interface Recipe {
  slug: string;
  kind: string;
  title: string;
  rationale: string;
  cfg: Config;
  /** The mock content drawn inside the demo surface. */
  sample: { heading: string; body: string; action: string };
}

/**
 * One curated pairing, shown on a surface you can actually move around inside.
 *
 * The demo runs in live mode: the point of a recipe is how it feels against
 * real content, and a scripted path cannot show you that. Hovering the panel
 * also promotes the recipe to the page cursor, so the two agree.
 */
export function RecipePanel({ recipe, index }: { recipe: Recipe; index: number }) {
  const { ref, inView } = useInView<HTMLElement>();
  const { preview } = useSiteCursor();
  const dark = recipe.cfg.dark;

  const ground = dark ? '#0a0d13' : '#eef0f4';
  const ink = dark ? '#dfe4ec' : '#1a2130';
  const muted = dark ? '#6b7686' : '#5d6879';
  const line = dark ? '#212938' : '#d2d7e0';

  return (
    <article
      ref={ref}
      className="card grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
      onPointerEnter={() => preview(recipe.cfg)}
      onPointerLeave={() => preview(null)}
    >
      <div className="relative min-h-[20rem]" style={{ background: ground }}>
        {inView && (
          <PreviewCanvas config={recipe.cfg} mode="live" interactive seed={index + 20} />
        )}

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-4 p-8">
          <p
            className="font-mono text-[0.62rem] uppercase tracking-[0.18em]"
            style={{ color: muted }}
          >
            {recipe.kind}
          </p>
          <h3
            className="max-w-[16ch] text-[clamp(1.5rem,3vw,2.2rem)] leading-[1.05]"
            style={{ color: ink }}
          >
            {recipe.sample.heading}
          </h3>
          <p className="max-w-[38ch] text-sm leading-relaxed" style={{ color: muted }}>
            {recipe.sample.body}
          </p>
          <span
            className="pointer-events-auto mt-2 inline-flex w-fit rounded-sm border px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.1em]"
            style={{ borderColor: line, color: ink }}
            data-cursor="button"
            data-cursor-label={recipe.sample.action}
          >
            {recipe.sample.action}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-rule p-6 lg:border-l lg:border-t-0">
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="text-lg leading-tight">{recipe.title}</h4>
          <span className="readout flex-none text-dim">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <p className="text-[0.86rem] leading-relaxed text-dim">{recipe.rationale}</p>

        <dl className="mt-auto space-y-1.5 pt-2">
          <Row k="style" v={recipe.cfg.style} />
          <Row k="click" v={recipe.cfg.click} />
          <Row k="hover" v={recipe.cfg.hover} />
          <Row k="color" v={'#' + recipe.cfg.color} swatch={recipe.cfg.color} />
        </dl>

        <Link
          href={`/builder?${toQuery(recipe.cfg)}`}
          className="btn mt-2 w-full"
          data-cursor-label="Open"
        >
          Open in builder
        </Link>
      </div>
    </article>
  );
}

function Row({ k, v, swatch }: { k: string; v: string; swatch?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--rule-soft)] pb-1.5">
      <dt className="readout text-dim">{k}</dt>
      <dd className="readout flex items-center gap-2 text-ink">
        {swatch && (
          <span
            className="h-2.5 w-2.5 rounded-full border border-[var(--rule)]"
            style={{ background: '#' + swatch }}
            aria-hidden="true"
          />
        )}
        {v}
      </dd>
    </div>
  );
}
