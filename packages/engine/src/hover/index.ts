import {
  hoverHide,
  hoverInvert,
  hoverLabel,
  hoverMagnet,
  hoverNone,
  hoverOutline,
  hoverScale,
  hoverShrink,
} from './base';
import { hoverMoreTransforms } from './more';
import type { HoverTransform } from '../core/types';

/**
 * Barrel only.
 *
 * The definitions live in `base.ts` and `more.ts`, and — importantly — neither
 * of those files imports the other. When a hover transform is compiled as a
 * standalone CDN chunk, esbuild bundles the file it came from; if that file
 * pulled in its sibling, every chunk would carry all thirty transforms. It did,
 * once: each chunk weighed 3.8kb instead of 0.2kb and pushed the worst-case
 * embed over budget. Keep the two definition files independent of each other.
 */
export const hoverTransforms: HoverTransform[] = [
  hoverNone,
  hoverScale,
  hoverShrink,
  hoverMagnet,
  hoverInvert,
  hoverLabel,
  hoverOutline,
  hoverHide,
  ...hoverMoreTransforms,
];

export * from './base';
export * from './more';
