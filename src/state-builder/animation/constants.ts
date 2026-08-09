import type { InterpolationKind, EasingType, LabeledOption, AnimationPreset } from './types.ts';

export const INTERPOLATION_KINDS: readonly LabeledOption<InterpolationKind>[] = [
  { value: 'scalar', label: 'Scalar' },
  { value: 'vec3', label: 'Vector3' },
  { value: 'rotation_matrix', label: 'Rotation Matrix' },
  { value: 'transform_matrix', label: 'Transform Matrix' },
  { value: 'color', label: 'Color' },
];

export const EASING_OPTIONS: readonly LabeledOption<EasingType>[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'cubic-in', label: 'Cubic In' },
  { value: 'cubic-out', label: 'Cubic Out' },
  { value: 'cubic-in-out', label: 'Cubic In-Out' },
  { value: 'quad-in', label: 'Quad In' },
  { value: 'quad-out', label: 'Quad Out' },
  { value: 'quad-in-out', label: 'Quad In-Out' },
  { value: 'sin-in', label: 'Sine In' },
  { value: 'sin-out', label: 'Sine Out' },
  { value: 'sin-in-out', label: 'Sine In-Out' },
  { value: 'exp-in', label: 'Exponential In' },
  { value: 'exp-out', label: 'Exponential Out' },
  { value: 'exp-in-out', label: 'Exponential In-Out' },
  { value: 'circle-in', label: 'Circle In' },
  { value: 'circle-out', label: 'Circle Out' },
  { value: 'circle-in-out', label: 'Circle In-Out' },
  { value: 'bounce-in', label: 'Bounce In' },
  { value: 'bounce-out', label: 'Bounce Out' },
  { value: 'bounce-in-out', label: 'Bounce In-Out' },
];

/** Animatable properties keyed by node kind */
const ANIMATABLE_PROPERTIES: Record<string, LabeledOption[]> = {
  representation: [
    { value: 'opacity', label: 'Opacity' },
    { value: 'size_factor', label: 'Size Factor' },
  ],
  color: [
    { value: 'color', label: 'Color' },
  ],
  transform: [
    { value: 'matrix', label: 'Transform Matrix' },
    { value: 'rotation', label: 'Rotation' },
    { value: 'translation', label: 'Translation' },
  ],
  primitives: [
    { value: 'label_opacity', label: 'Label Opacity' },
    { value: 'label_background_color', label: 'Label Background Color' },
  ],
  primitive: [
    { value: 'opacity', label: 'Opacity' },
    { value: 'color', label: 'Color' },
  ],
  camera: [
    { value: 'position', label: 'Position' },
    { value: 'target', label: 'Target' },
  ],
  opacity: [
    { value: 'value', label: 'Opacity Value' },
  ],
  component: [
    { value: 'opacity', label: 'Opacity' },
  ],
};

/** Common properties available regardless of target kind */
const COMMON_PROPERTIES: LabeledOption[] = [
  { value: 'opacity', label: 'Opacity' },
  { value: 'label_opacity', label: 'Label Opacity' },
];

/** Maps each property to its required interpolation kind */
export const PROPERTY_KIND_MAP: Record<string, InterpolationKind> = {
  opacity: 'scalar',
  size_factor: 'scalar',
  label_opacity: 'scalar',
  value: 'scalar',
  position: 'vec3',
  target: 'vec3',
  translation: 'vec3',
  rotation: 'rotation_matrix',
  matrix: 'transform_matrix',
  color: 'color',
  label_background_color: 'color',
};

export const ANIMATION_PRESETS: readonly AnimationPreset[] = [
  {
    id: 'fade-in',
    name: 'Fade In',
    description: 'Fade label opacity from 0 to 1',
    steps: [
      { kind: 'scalar', property: 'label_opacity', start: 0, end: 1, duration_ms: 1000, easing: 'cubic-out' },
    ],
  },
  {
    id: 'fade-out',
    name: 'Fade Out',
    description: 'Fade label opacity from 1 to 0',
    steps: [
      { kind: 'scalar', property: 'label_opacity', start: 1, end: 0, duration_ms: 1000, easing: 'cubic-in' },
    ],
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Pulse opacity between 0.3 and 1 (3 cycles)',
    steps: [
      { kind: 'scalar', property: 'opacity', start: 0.3, end: 1, duration_ms: 500, frequency: 3, alternate_direction: true, easing: 'sin-in-out' },
    ],
    animationDefaults: { loop: true },
  },
  {
    id: 'spin',
    name: 'Trackball Spin',
    description: 'Continuous camera trackball rotation',
    steps: [],
    animationDefaults: { autoplay: true, loop: true, trackball: { enabled: true, speed: -0.05 } },
  },
  {
    id: 'fade-in-sequence',
    name: 'Fade In Sequence',
    description: 'Fade in label opacity, then hold visible',
    steps: [
      { kind: 'scalar', property: 'label_opacity', start: 0, end: 1, duration_ms: 1000, start_ms: 0, easing: 'cubic-out' },
    ],
    animationDefaults: { autoplay: true },
  },
];

/** Color mapping for timeline bar visualization by kind */
export const KIND_COLORS: Record<InterpolationKind, string> = {
  scalar: '#3b82f6',          // blue
  vec3: '#22c55e',            // green
  color: '#f97316',           // orange
  rotation_matrix: '#a855f7', // purple
  transform_matrix: '#ef4444', // red
};

/** Which node kinds are valid targets for each interpolation kind */
export const VALID_REF_KINDS: Record<InterpolationKind, string[]> = {
  scalar: ['representation', 'opacity', 'primitives', 'primitive', 'component'],
  vec3: ['camera', 'transform'],
  rotation_matrix: ['transform'],
  transform_matrix: ['transform'],
  color: ['color', 'primitive', 'primitives'],
};

/** Get animatable properties for a given node kind */
export function getAnimatableProperties(targetKind?: string, interpolationKind?: InterpolationKind): LabeledOption[] {
  let properties: LabeledOption[];
  if (targetKind && ANIMATABLE_PROPERTIES[targetKind]) {
    properties = ANIMATABLE_PROPERTIES[targetKind];
  } else {
    properties = COMMON_PROPERTIES;
  }
  if (interpolationKind) {
    properties = properties.filter((p) => {
      const required = PROPERTY_KIND_MAP[p.value];
      return !required || required === interpolationKind;
    });
  }
  return properties;
}
