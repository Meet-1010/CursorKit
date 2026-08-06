'use client';

import { Engine } from '@cursorkit/engine';
import { useEffect, useRef } from 'react';
import type { Config } from '@/lib/config';

export type PreviewMode = 'live' | 'scripted' | 'idle';

/**
 * A cursor rendered into an ordinary canvas rather than over the page.
 *
 * Two modes matter:
 *   live      — the visitor's pointer drives it, mapped into canvas space.
 *   scripted  — a synthetic pointer traces a path and clicks on a cycle, so a
 *               gallery card can demonstrate a style with no interaction.
 *
 * The scripted path is a Lissajous figure rather than a circle: it varies
 * speed and curvature continuously, which is what actually distinguishes the
 * trail and particle styles from one another. A circle makes them all look
 * the same.
 */
export function PreviewCanvas({
  config,
  mode = 'scripted',
  className,
  seed = 1,
  interactive = false,
}: {
  config: Config;
  mode?: PreviewMode;
  className?: string;
  seed?: number;
  interactive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Boot once; configuration changes are applied in place below.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(
      { ...config, zIndex: 0 },
      { canvas, keepNativeCursor: true, manualInput: true, seed },
    );
    engineRef.current = engine;
    engine.start();
    engine.setInside(true);

    let raf = 0;
    let t = 0;
    let lastClick = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      if (modeRef.current !== 'scripted') return;

      t += dt;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      // Incommensurate frequencies, so the figure never repeats exactly.
      const x = w / 2 + Math.sin(t * 0.62) * w * 0.3 + Math.sin(t * 0.23) * w * 0.08;
      const y = h / 2 + Math.sin(t * 0.41 + 1.2) * h * 0.28;
      engine.moveTo(x, y);

      // A click every few seconds so the click effect is part of the demo.
      if (t - lastClick > 3.1) {
        lastClick = t;
        engine.press(true, x, y);
        window.setTimeout(() => engine.press(false), 90);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      engine.destroy();
      engineRef.current = null;
    };
    // Config is intentionally not a dependency: re-creating the engine on every
    // slider drag would reset all style state and make the preview stutter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  useEffect(() => {
    engineRef.current?.update(config);
  }, [config]);

  // Live mode maps real pointer events into canvas coordinates.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !interactive) return;

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      if (modeRef.current !== 'live') return;
      const { x, y } = local(e);
      engineRef.current?.moveTo(x, y);
    };
    const onDown = (e: PointerEvent) => {
      if (modeRef.current !== 'live' || e.button !== 0) return;
      const { x, y } = local(e);
      engineRef.current?.press(true, x, y);
    };
    const onUp = () => engineRef.current?.press(false);
    const onEnter = () => engineRef.current?.setInside(true);
    const onLeave = () => {
      // Keep the scripted demo visible; only a live preview should empty out.
      if (modeRef.current === 'live') engineRef.current?.setInside(false);
    };

    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    canvas.addEventListener('pointerenter', onEnter, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      // Absolutely positioned on purpose. An in-flow canvas contributes its own
      // height to the parent, so resizing the backing store grows the parent,
      // which the ResizeObserver reports as a new size, which grows the canvas
      // again — a feedback loop that runs away to six-figure pixel heights.
      // Out of flow, the parent's size is the only input. Hosts must therefore
      // be `position: relative` with a definite height.
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}
