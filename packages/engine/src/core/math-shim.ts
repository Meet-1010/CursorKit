/**
 * Stand-in for `math.ts` used when a style or effect is compiled as a
 * standalone CDN chunk. The core bundle has already published these helpers on
 * `window.CursorKit.m`, so chunks reference them instead of inlining a second
 * copy — which is what keeps a two-module embed under 8kb gzipped.
 *
 * Generated shape must stay in sync with `math.ts`. `build.mjs` asserts that.
 */

const m: Record<string, any> = (globalThis as any).CursorKit?.m || {};

export const TAU: number = m.TAU;
export const HALF_PI: number = m.HALF_PI;
export const clamp = m.clamp;
export const clamp01 = m.clamp01;
export const lerp = m.lerp;
export const damp = m.damp;
export const newLag = m.newLag;
export const follow = m.follow;
export const smoothstep = m.smoothstep;
export const easeOutCubic = m.easeOutCubic;
export const easeOutQuint = m.easeOutQuint;
export const easeOutExpo = m.easeOutExpo;
export const easeInCubic = m.easeInCubic;
export const easeInOutCubic = m.easeInOutCubic;
export const easeOutBack = m.easeOutBack;
export const elasticPulse = m.elasticPulse;
export const dist = m.dist;
export const angleDelta = m.angleDelta;
export const dampAngle = m.dampAngle;
export const mulberry32 = m.mulberry32;
export const noise1 = m.noise1;
export const parseHex = m.parseHex;
export const rgba = m.rgba;
export const hex = m.hex;
export const mixRGB = m.mixRGB;
export const luminance = m.luminance;
export const shiftHue = m.shiftHue;
export const closedSpline = m.closedSpline;
export const polyline = m.polyline;
export const ngon = m.ngon;
export const star = m.star;
export const sparkle = m.sparkle;
export const roundRect = m.roundRect;

export type RGB = { r: number; g: number; b: number };
export type Lag = { x: number; y: number; init: boolean };
