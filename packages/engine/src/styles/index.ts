import { brutalistStyles } from './brutalist';
import { fluidStyles } from './fluid';
import { geometricStyles } from './geometric';
import { luxuryStyles } from './luxury';
import { minimalStyles } from './minimal';
import { moreStyles } from './more';
import { neumorphicStyles } from './neumorphic';
import { particleStyles } from './particles';
import { playfulStyles } from './playful';
import { techStyles } from './tech';
import { trailStyles } from './trails';
import type { CursorStyle } from '../core/types';

export const styleDefs: CursorStyle<any>[] = [
  ...minimalStyles,
  ...geometricStyles,
  ...fluidStyles,
  ...trailStyles,
  ...particleStyles,
  ...techStyles,
  ...playfulStyles,
  ...luxuryStyles,
  ...neumorphicStyles,
  ...brutalistStyles,
  // Second wave for the original categories. Ordered last so the gallery's
  // default ordering keeps each category's foundational styles first.
  ...moreStyles,
];

export * from './minimal';
export * from './geometric';
export * from './fluid';
export * from './trails';
export * from './particles';
export * from './tech';
export * from './playful';
export * from './luxury';
export * from './neumorphic';
export * from './brutalist';
export * from './more';
