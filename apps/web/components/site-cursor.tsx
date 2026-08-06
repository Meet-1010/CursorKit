'use client';

import { Engine, hasFinePointer } from '@cursorkit/engine';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { SITE_DEFAULT, type Config } from '@/lib/config';

/**
 * Runs the real engine on this site's own cursor.
 *
 * This is the product demonstrating itself: hovering a style card in the
 * gallery retargets the page cursor to that style immediately, so you evaluate
 * every option with your own hand rather than by watching a loop. `preview`
 * takes over while set; releasing it restores whatever the page had chosen.
 */

interface CursorAPI {
  /** Temporarily override the page cursor. Pass null to release. */
  preview: (cfg: Partial<Config> | null) => void;
  /** Change the page's own baseline cursor. */
  setBase: (cfg: Config) => void;
  /** False on touch devices, where no cursor is rendered at all. */
  active: boolean;
}

const Ctx = createContext<CursorAPI>({
  preview: () => {},
  setBase: () => {},
  active: false,
});

export const useSiteCursor = (): CursorAPI => useContext(Ctx);

export function SiteCursor({
  children,
  config = SITE_DEFAULT,
}: {
  children: ReactNode;
  config?: Config;
}) {
  const engineRef = useRef<Engine | null>(null);
  const baseRef = useRef<Config>(config);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!hasFinePointer()) return;

    const engine = new Engine({ ...baseRef.current, zIndex: 2147483000 });
    engineRef.current = engine;
    engine.start();
    setActive(true);

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      engine.fire(e.clientX, e.clientY);
    };
    document.addEventListener('pointerdown', onDown, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', onDown);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const preview = useCallback((cfg: Partial<Config> | null) => {
    const e = engineRef.current;
    if (!e) return;
    // Releasing restores every field, not just the ones the preview set —
    // otherwise a card that only overrode `style` would leak its colour.
    e.update(cfg ? { ...baseRef.current, ...cfg } : baseRef.current);
  }, []);

  const setBase = useCallback((cfg: Config) => {
    baseRef.current = cfg;
    engineRef.current?.update(cfg);
  }, []);

  const api = useMemo(() => ({ preview, setBase, active }), [preview, setBase, active]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
