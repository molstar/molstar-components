export type {
  InterpolationKind,
  EasingType,
  SimpleInterpolationStep,
  TransformMatrixInterpolationStep,
  InterpolationStep,
  TrackballSpin,
  AnimationParams,
  AnimationPreset,
  RefInfo,
} from './types.ts';

export {
  INTERPOLATION_KINDS,
  EASING_OPTIONS,
  PROPERTY_KIND_MAP,
  ANIMATION_PRESETS,
  KIND_COLORS,
  VALID_REF_KINDS,
  getAnimatableProperties,
} from './constants.ts';

export {
  createDefaultAnimationParams,
  createEmptyInterpolationStep,
  applyPreset,
  computeAnimationDuration,
} from './builders.ts';

export {
  convertAnimationToMVSNode,
  convertMVSNodeToAnimationParams,
  extractAnimationFromUINodes,
} from './mvs-conversion.ts';

export { extractRefsFromNodes, filterRefsForKind } from './refs.ts';
