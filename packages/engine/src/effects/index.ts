import { burstEffects } from './burst';
import { chaosEffects } from './chaos';
import { digitalEffects } from './digital';
import { materialEffects } from './material';
import { inkEffects } from './ink';
import { physicsEffects } from './physics';
import { portalEffects } from './portal';
import { rippleEffects } from './ripple';
import { shockEffects } from './shock';
import { subtleEffects } from './subtle';
import type { ClickEffect } from '../core/types';

export const effectDefs: ClickEffect<any>[] = [
  ...rippleEffects,
  ...burstEffects,
  ...shockEffects,
  ...inkEffects,
  ...digitalEffects,
  ...physicsEffects,
  ...portalEffects,
  ...subtleEffects,
  ...materialEffects,
  ...chaosEffects,
];

export { materialEffects } from './material';
export { chaosEffects } from './chaos';

export { rippleEffects } from './ripple';
export { burstEffects } from './burst';
export { shockEffects } from './shock';
export { inkEffects } from './ink';
export { digitalEffects } from './digital';
export { physicsEffects } from './physics';
export { portalEffects } from './portal';
export { subtleEffects } from './subtle';
