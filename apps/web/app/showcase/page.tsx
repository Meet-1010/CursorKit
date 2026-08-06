import type { Metadata } from 'next';
import Link from 'next/link';
import { RecipePanel, type Recipe } from '@/components/recipe-panel';
import { SITE_DEFAULT } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Showcase',
  description:
    'Curated cursor recipes for portfolios, SaaS, editorial, agency, commerce, and game sites.',
};

/**
 * Recipes rather than customer logos.
 *
 * CursorKit is new and has no shipped sites to point at yet, so this page shows
 * what it is actually for: opinionated pairings for particular kinds of work,
 * each on a surface you can move around inside. When real sites arrive, they
 * join these — they do not replace them.
 */
const RECIPES: Recipe[] = [
  {
    slug: 'portfolio',
    kind: 'Portfolio',
    title: 'Quiet until it matters',
    rationale:
      'A hairline ring disappears into the layout and only asserts itself over a project link. The magnet pull makes targets feel like they want to be clicked, which is the whole job of a portfolio index.',
    cfg: { ...SITE_DEFAULT, style: 'thin-line-circle', click: 'fade-ring', hover: 'magnet', color: 'ffffff', color2: 'ffffff', size: 1 },
    sample: {
      heading: 'Selected work, 2019–2026',
      body: 'Twelve projects. Identity, motion, and the occasional bad idea that worked.',
      action: 'View index',
    },
  },
  {
    slug: 'saas',
    kind: 'SaaS product',
    title: 'Precision as a promise',
    rationale:
      'The readout cursor prints live coordinates beside a small reticle. On a product that sells accuracy, a cursor that visibly measures things is doing marketing work while it does interface work.',
    cfg: { ...SITE_DEFAULT, style: 'data-cursor', click: 'crosshair-lock', hover: 'outline', color: '7dd3fc', color2: 'ffffff', size: 0.95 },
    sample: {
      heading: 'Every event, accounted for',
      body: 'Trace a request across nineteen services without leaving the timeline.',
      action: 'Start free',
    },
  },
  {
    slug: 'editorial',
    kind: 'Editorial',
    title: 'Made of ink',
    rationale:
      'A brush trail that pools where you slow down and thins where you rush, with a splat on click. Reading-heavy pages can carry a heavier cursor because the eye is already moving slowly.',
    cfg: { ...SITE_DEFAULT, style: 'ink-trail', click: 'ink-splat', hover: 'label', color: 'e8e4dc', color2: 'b9a88f', size: 1.05 },
    sample: {
      heading: 'The long argument against speed',
      body: 'Six thousand words on why the fastest interface is rarely the best one.',
      action: 'Read',
    },
  },
  {
    slug: 'agency',
    kind: 'Creative studio',
    title: 'Physical and loud',
    rationale:
      'A blob that squares itself off to whatever it is drawn toward, with a shockwave on click. This is the one to reach for when the brief says the site should feel like a toy.',
    cfg: { ...SITE_DEFAULT, style: 'magnetic-blob', click: 'shockwave', hover: 'magnet', color: 'ff4d9d', color2: '9b5cff', size: 1.15 },
    sample: {
      heading: 'We make things move',
      body: 'A studio of nine, working on identity, product, and the space between them.',
      action: 'Say hello',
    },
  },
  {
    slug: 'commerce',
    kind: 'Commerce',
    title: 'Reward the click',
    rationale:
      'Coins scatter when you add to cart. Playful, but the real work is the label transform: the cursor tells you what a control does before you commit to it.',
    cfg: { ...SITE_DEFAULT, style: 'editorial-dot', click: 'coin-burst', hover: 'label', color: 'ffa132', color2: 'ffd9a0', size: 1 },
    sample: {
      heading: 'The everyday chair',
      body: 'Solid ash, hand-finished. Ships in three weeks, flat, with one hex key.',
      action: 'Add to cart',
    },
  },
  {
    slug: 'game',
    kind: 'Game or launch',
    title: 'Built for a dark room',
    rationale:
      'Additive neon over near-black, with a portal opening on click. Every part of this is wrong on a white marketing page and exactly right on a landing page for something you play.',
    cfg: { ...SITE_DEFAULT, style: 'neon-trail', click: 'portal-open', hover: 'scale-expand', color: '35e0ff', color2: 'b04dff', size: 1.1 },
    sample: {
      heading: 'Descent — early access',
      body: 'Eleven floors, no map, no saves. Wishlist now, regret it in November.',
      action: 'Wishlist',
    },
  },
];

export default function ShowcasePage() {
  return (
    <>
      <section className="border-b border-rule">
        <div className="shell py-16">
          <p className="section-label eyebrow">Showcase</p>
          <h1 className="mt-5 max-w-[18ch] text-[clamp(2.2rem,5vw,3.6rem)]">
            Six recipes, on surfaces you can use.
          </h1>
          <p className="mt-5 max-w-[58ch] leading-relaxed text-dim">
            Each panel below is live — move your pointer inside it and click.
            These are opinionated pairings rather than a menu: a cursor that
            works on a game landing page is usually wrong on a checkout, and
            the reasoning matters more than the combination.
          </p>
        </div>
      </section>

      <div className="shell space-y-4 py-12">
        {RECIPES.map((r, i) => (
          <RecipePanel key={r.slug} recipe={r} index={i} />
        ))}
      </div>

      <section className="border-t border-rule">
        <div className="shell py-16 text-center">
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)]">Shipped something with it?</h2>
          <p className="mx-auto mt-4 max-w-[46ch] leading-relaxed text-dim">
            Community submissions open with the public launch. Until then the
            builder is the fastest way to find a pairing that fits your work.
          </p>
          <Link href="/builder" className="btn btn-signal mt-8">
            Open the builder
          </Link>
        </div>
      </section>
    </>
  );
}
