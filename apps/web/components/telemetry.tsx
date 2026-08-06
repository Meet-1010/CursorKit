'use client';

import { useEffect, useRef } from 'react';

/**
 * Live pointer readout.
 *
 * Written straight to the DOM from a rAF loop rather than through React state:
 * this updates every frame, and re-rendering a component 120 times a second to
 * change four numbers would be the slowest thing on the page.
 */
export function Telemetry({ className = '' }: { className?: string }) {
  const xRef = useRef<HTMLSpanElement>(null);
  const yRef = useRef<HTMLSpanElement>(null);
  const vRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let px = 0;
    let py = 0;
    let x = 0;
    let y = 0;
    let vel = 0;
    let raf = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const pad = (n: number) => String(Math.round(n)).padStart(4, '0');

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.max((now - last) / 1000, 1 / 240);
      last = now;

      const inst = Math.hypot(x - px, y - py) / dt;
      // Smooth toward the instantaneous reading so the number is legible
      // instead of flickering through four digits every frame.
      vel += (inst - vel) * Math.min(dt * 8, 1);
      px = x;
      py = y;

      if (xRef.current) xRef.current.textContent = pad(x);
      if (yRef.current) yRef.current.textContent = pad(y);
      if (vRef.current) vRef.current.textContent = pad(vel);
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${Math.min(vel / 2400, 1).toFixed(3)})`;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div className={`readout select-none ${className}`} aria-hidden="true">
      <div className="flex items-center gap-4 text-dim">
        <Field label="X" inner={xRef} />
        <Field label="Y" inner={yRef} />
        <Field label="PX/S" inner={vRef} />
      </div>
      <span className="mt-2 block h-px w-full overflow-hidden bg-[var(--rule)]">
        <span
          ref={barRef}
          className="block h-px w-full origin-left bg-signal"
          style={{ transform: 'scaleX(0)' }}
        />
      </span>
    </div>
  );
}

function Field({
  label,
  inner,
}: {
  label: string;
  inner: React.RefObject<HTMLSpanElement>;
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[0.62rem] tracking-[0.16em] opacity-60">{label}</span>
      <span ref={inner} className="tabular-nums text-ink">
        0000
      </span>
    </span>
  );
}
