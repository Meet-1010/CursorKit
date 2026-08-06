import type { ClickEffect, CursorStyle, HoverTransform } from './types';

/**
 * Plugin registry. Styles and effects register themselves at module scope, so
 * a CDN chunk is loadable in any order relative to the core — the engine polls
 * the registry on boot and again whenever a chunk arrives late.
 */

const styles = new Map<string, CursorStyle>();
const effects = new Map<string, ClickEffect>();
const hovers = new Map<string, HoverTransform>();

type Listener = () => void;
const listeners = new Set<Listener>();

const notify = () => {
  for (const fn of listeners) fn();
};

export function registerStyle(...defs: CursorStyle[]): void {
  for (const d of defs) styles.set(d.id, d);
  notify();
}

export function registerEffect(...defs: ClickEffect[]): void {
  for (const d of defs) effects.set(d.id, d);
  notify();
}

export function registerHover(...defs: HoverTransform[]): void {
  for (const d of defs) hovers.set(d.id, d);
  notify();
}

export const getStyle = (id: string): CursorStyle | undefined => styles.get(id);
export const getEffect = (id: string): ClickEffect | undefined => effects.get(id);
export const getHover = (id: string): HoverTransform | undefined => hovers.get(id);

export const allStyles = (): CursorStyle[] => [...styles.values()];
export const allEffects = (): ClickEffect[] => [...effects.values()];
export const allHovers = (): HoverTransform[] => [...hovers.values()];

export const hasStyle = (id: string): boolean => styles.has(id);
export const hasEffect = (id: string): boolean => effects.has(id);

/** Called by the engine so it can pick up chunks that load after boot. */
export function onRegister(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
