'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reports whether an element is near the viewport.
 *
 * The gallery uses this to mount cursor engines only for visible cards. Sixty-six
 * simultaneous canvas loops would be wasteful; a dozen is nothing. The generous
 * root margin means a card is already running by the time it is scrolled to,
 * so previews never appear to start late.
 */
export function useInView<T extends Element>(rootMargin = '300px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
