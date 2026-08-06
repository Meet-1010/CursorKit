import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Builder } from '@/components/builder';

export const metadata: Metadata = {
  title: 'Builder',
  description:
    'Pick a cursor, a click effect, and a hover transform. Copy the script tag.',
};

export default function BuilderPage() {
  return (
    <>
      <section className="border-b border-rule">
        <div className="shell flex flex-wrap items-end justify-between gap-6 py-10">
          <div>
            <p className="section-label eyebrow">Builder</p>
            <h1 className="mt-4 text-[clamp(1.9rem,4vw,2.8rem)]">Assemble your cursor.</h1>
          </div>
          <p className="max-w-[40ch] text-sm leading-relaxed text-dim">
            Everything you change is written to this page’s address, so the URL
            in your bar is already the share link. Copy the tag when it feels
            right.
          </p>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="shell py-16">
            <p className="readout text-dim">Loading console…</p>
          </div>
        }
      >
        <Builder />
      </Suspense>
    </>
  );
}
