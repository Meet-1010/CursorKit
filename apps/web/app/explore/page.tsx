import { Suspense } from 'react';
import type { Metadata } from 'next';
import { STYLE_COUNT } from '@cursorkit/engine/manifest';
import { ExploreGallery } from '@/components/explore-gallery';

export const metadata: Metadata = {
  title: 'Explore',
  description: `Browse all ${STYLE_COUNT} CursorKit cursor styles with live previews.`,
};

export default function ExplorePage() {
  return (
    <>
      <section className="border-b border-rule">
        <div className="shell py-16">
          <p className="section-label eyebrow">Explore</p>
          <h1 className="mt-5 max-w-[16ch] text-[clamp(2.2rem,5vw,3.6rem)]">
            Every style, running live.
          </h1>
          <p className="mt-5 max-w-[54ch] leading-relaxed text-dim">
            Each card animates on its own. Hover one and the cursor you are
            holding becomes that style — the fastest way to know whether it
            suits your page is to move it around yourself.
          </p>
        </div>
      </section>

      <Suspense fallback={<GalleryFallback />}>
        <ExploreGallery />
      </Suspense>
    </>
  );
}

function GalleryFallback() {
  return (
    <div className="shell py-16">
      <p className="readout text-dim">Loading library…</p>
    </div>
  );
}
