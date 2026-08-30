export type InterpolationKind = 'scalar' | 'vec3' | 'rotation_matrix' | 'transform_matrix' | 'color';

export type EasingType =
  | 'linear'
  | 'bounce-in' | 'bounce-out' | 'bounce-in-out'
  | 'cubic-in' | 'cubic-out' | 'cubic-in-out'
  | 'quad-in' | 'quad-out' | 'quad-in-out'
  | 'sin-in' | 'sin-out' | 'sin-in-out'
  | 'exp-in' | 'exp-out' | 'exp-in-out'
  | 'circle-in' | 'circle-out' | 'circle-in-out';

/** Common fields shared by all interpolation step kinds */
interface InterpolationStepBase {
  id: string;
  target_ref: string;
  property: string;
  duration_ms: number;
  start_ms?: number;
}

/** Interpolation step for scalar, vec3, rotation_matrix, and color kinds */
export interface SimpleInterpolationStep extends InterpolationStepBase {
  kind: 'scalar' | 'vec3' | 'rotation_matrix' | 'color';
  start?: number | number[] | null;
  end?: number | number[] | null;
  easing?: EasingType;
  frequency?: number;
  alternate_direction?: boolean;
  discrete?: boolean;         // scalar only
  noise_magnitude?: number;
  spherical?: boolean;        // vec3 only
}

/** Interpolation step for transform_matrix kind — separate rotation/translation/scale channels */
export interface TransformMatrixInterpolationStep extends InterpolationStepBase {
  kind: 'transform_matrix';
  pivot?: [number, number, number] | null;
  // Rotation channel
  rotation_start?: number[] | null;
  rotation_end?: number[] | null;
  rotation_noise_magnitude?: number;
  rotation_easing?: EasingType;
  rotation_frequency?: number;
  rotation_alternate_direction?: boolean;
  // Translation channel
  translation_start?: [number, number, number] | null;
  translation_end?: [number, number, number] | null;
  translation_noise_magnitude?: number;
  translation_easing?: EasingType;
  translation_frequency?: number;
  translation_alternate_direction?: boolean;
  // Scale channel
  scale_start?: [number, number, number] | null;
  scale_end?: [number, number, number] | null;
  scale_noise_magnitude?: number;
  scale_easing?: EasingType;
  scale_frequency?: number;
  scale_alternate_direction?: boolean;
}

export type InterpolationStep = SimpleInterpolationStep | TransformMatrixInterpolationStep;

/** Trackball spin configuration (stored in animation custom field) */
export interface TrackballSpin {
  enabled: boolean;
  speed: number;
}

/** Animation container params — mirrors MVS animation node + UI state */
export interface AnimationParams {
  frame_time_ms?: number;
  duration_ms?: number | null;
  autoplay?: boolean;
  loop?: boolean;
  include_camera?: boolean;
  include_canvas?: boolean;
  steps: InterpolationStep[];
  trackball?: TrackballSpin;
  /** Raw custom data from the MVS node (e.g. molstar_trackball for non-spin modes) */
  custom?: Record<string, unknown>;
}

/** Step template used in presets — all step fields except id and target_ref */
export type InterpolationStepTemplate = Omit<SimpleInterpolationStep, 'id' | 'target_ref'> | Omit<TransformMatrixInterpolationStep, 'id' | 'target_ref'>;

/** Animation preset definition */
export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  /** Steps without id/target_ref — those are filled in when applied */
  steps: InterpolationStepTemplate[];
  /** Default animation settings to apply with this preset */
  animationDefaults?: Partial<Pick<AnimationParams, 'autoplay' | 'loop' | 'duration_ms' | 'trackball'>>;
}

/** Ref with its owning node kind (for filtered dropdowns) */
export interface RefInfo {
  ref: string;
  kind: string;
}

/** Labeled option for dropdowns */
export interface LabeledOption<T = string> {
  value: T;
  label: string;
}
