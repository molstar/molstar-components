// ============================================================
// Animation Builder Types & Utilities
//
// Pure business logic for MVS animation nodes: types, presets,
// conversion to/from MVS format, and import extraction.
// ============================================================

import type { UINode } from './ui-builder.ts';
import { IDENTITY_3x3 } from './transform-params.ts';

// ============================================================
// Types
// ============================================================

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

// ============================================================
// Constants
// ============================================================

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

// ============================================================
// Factory Functions
// ============================================================

let _nextStepId = 1;

/** Create a unique step ID */
function nextStepId(): string {
  return `step-${Date.now()}-${_nextStepId++}`;
}

/** Create default animation params (empty, no steps) */
export function createDefaultAnimationParams(): AnimationParams {
  return {
    autoplay: false,
    loop: false,
    steps: [],
  };
}

/** Create a blank interpolation step */
export function createEmptyInterpolationStep(kind: InterpolationKind = 'scalar'): InterpolationStep {
  if (kind === 'transform_matrix') {
    return {
      id: nextStepId(),
      kind: 'transform_matrix',
      target_ref: '',
      property: 'matrix',
      duration_ms: 1000,
    };
  }
  if (kind === 'rotation_matrix') {
    return {
      id: nextStepId(),
      kind: 'rotation_matrix',
      target_ref: '',
      property: 'rotation',
      duration_ms: 1000,
      start: [...IDENTITY_3x3] as unknown as number,
      end: [...IDENTITY_3x3] as unknown as number,
    };
  }
  return {
    id: nextStepId(),
    kind,
    target_ref: '',
    property: kind === 'color' ? 'color' : 'opacity',
    duration_ms: 1000,
    start: kind === 'scalar' ? 0 : undefined,
    end: kind === 'scalar' ? 1 : undefined,
  };
}

/** Apply a preset to a target ref, returning new steps and animation defaults */
export function applyPreset(preset: AnimationPreset, targetRef: string): {
  steps: InterpolationStep[];
  defaults: Partial<AnimationParams>;
} {
  const steps = preset.steps.map((stepTemplate) => ({
    ...stepTemplate,
    id: nextStepId(),
    target_ref: targetRef,
  })) as InterpolationStep[];

  const defaults: Partial<AnimationParams> = {};
  if (preset.animationDefaults) {
    if (preset.animationDefaults.autoplay !== undefined) defaults.autoplay = preset.animationDefaults.autoplay;
    if (preset.animationDefaults.loop !== undefined) defaults.loop = preset.animationDefaults.loop;
    if (preset.animationDefaults.duration_ms !== undefined) defaults.duration_ms = preset.animationDefaults.duration_ms;
    if (preset.animationDefaults.trackball !== undefined) defaults.trackball = preset.animationDefaults.trackball;
  }

  return { steps, defaults };
}

// ============================================================
// Conversion Utilities
// ============================================================

/** Convert AnimationParams to MVS node format for code generation */
export function convertAnimationToMVSNode(params: AnimationParams): {
  kind: 'animation';
  params: Record<string, unknown>;
  custom?: Record<string, unknown>;
  children: { kind: 'interpolate'; params: Record<string, unknown> }[];
} {
  const nodeParams: Record<string, unknown> = {};
  if (params.frame_time_ms !== undefined) nodeParams.frame_time_ms = params.frame_time_ms;
  if (params.duration_ms !== undefined && params.duration_ms !== null) nodeParams.duration_ms = params.duration_ms;
  if (params.autoplay) nodeParams.autoplay = true;
  if (params.loop) nodeParams.loop = true;
  if (params.include_camera) nodeParams.include_camera = true;
  if (params.include_canvas) nodeParams.include_canvas = true;

  // Trackball spin → custom field (top-level, not inside params)
  let custom: Record<string, unknown> | undefined;
  if (params.trackball?.enabled) {
    custom = {
      molstar_trackball: {
        name: 'spin',
        params: { speed: params.trackball.speed },
      },
    };
  }

  const children = params.steps.map((step) => {
    const interpolateParams: Record<string, unknown> = {
      kind: step.kind,
      target_ref: step.target_ref,
      property: step.property,
      duration_ms: step.duration_ms,
    };

    if (step.start_ms !== undefined && step.start_ms !== 0) {
      interpolateParams.start_ms = step.start_ms;
    }

    if (step.kind === 'transform_matrix') {
      // Transform matrix has separate channels
      const tm = step as TransformMatrixInterpolationStep;
      if (tm.pivot) interpolateParams.pivot = tm.pivot;
      if (tm.rotation_start) interpolateParams.rotation_start = tm.rotation_start;
      if (tm.rotation_end) interpolateParams.rotation_end = tm.rotation_end;
      if (tm.rotation_noise_magnitude) interpolateParams.rotation_noise_magnitude = tm.rotation_noise_magnitude;
      if (tm.rotation_easing && tm.rotation_easing !== 'linear') interpolateParams.rotation_easing = tm.rotation_easing;
      if (tm.rotation_frequency && tm.rotation_frequency > 1) interpolateParams.rotation_frequency = tm.rotation_frequency;
      if (tm.rotation_alternate_direction) interpolateParams.rotation_alternate_direction = true;
      if (tm.translation_start) interpolateParams.translation_start = tm.translation_start;
      if (tm.translation_end) interpolateParams.translation_end = tm.translation_end;
      if (tm.translation_noise_magnitude) interpolateParams.translation_noise_magnitude = tm.translation_noise_magnitude;
      if (tm.translation_easing && tm.translation_easing !== 'linear') interpolateParams.translation_easing = tm.translation_easing;
      if (tm.translation_frequency && tm.translation_frequency > 1) interpolateParams.translation_frequency = tm.translation_frequency;
      if (tm.translation_alternate_direction) interpolateParams.translation_alternate_direction = true;
      if (tm.scale_start) interpolateParams.scale_start = tm.scale_start;
      if (tm.scale_end) interpolateParams.scale_end = tm.scale_end;
      if (tm.scale_noise_magnitude) interpolateParams.scale_noise_magnitude = tm.scale_noise_magnitude;
      if (tm.scale_easing && tm.scale_easing !== 'linear') interpolateParams.scale_easing = tm.scale_easing;
      if (tm.scale_frequency && tm.scale_frequency > 1) interpolateParams.scale_frequency = tm.scale_frequency;
      if (tm.scale_alternate_direction) interpolateParams.scale_alternate_direction = true;
    } else {
      // Simple kinds: scalar, vec3, rotation_matrix, color
      const simple = step as SimpleInterpolationStep;
      if (step.kind === 'rotation_matrix') {
        // Always emit start and end for rotation_matrix — identity must be explicit in the output
        interpolateParams.start = (Array.isArray(simple.start) && simple.start.length === 9)
          ? simple.start : [...IDENTITY_3x3];
        interpolateParams.end = (Array.isArray(simple.end) && simple.end.length === 9)
          ? simple.end : [...IDENTITY_3x3];
      } else {
        if (simple.start !== undefined && simple.start !== null) interpolateParams.start = simple.start;
        if (simple.end !== undefined && simple.end !== null) interpolateParams.end = simple.end;
      }
      if (simple.easing && simple.easing !== 'linear') interpolateParams.easing = simple.easing;
      if (simple.frequency && simple.frequency > 1) interpolateParams.frequency = simple.frequency;
      if (simple.alternate_direction) interpolateParams.alternate_direction = true;
      if (simple.discrete) interpolateParams.discrete = true;
      if (simple.noise_magnitude) interpolateParams.noise_magnitude = simple.noise_magnitude;
      if (simple.spherical) interpolateParams.spherical = true;
    }

    return { kind: 'interpolate' as const, params: interpolateParams };
  });

  return { kind: 'animation', params: nodeParams, ...(custom ? { custom } : {}), children };
}

/** Convert an MVS animation node back to AnimationParams (for import) */
export function convertMVSNodeToAnimationParams(node: {
  kind: string;
  params?: Record<string, unknown>;
  children?: { kind: string; params?: Record<string, unknown> }[];
  custom?: Record<string, unknown>;
}): AnimationParams {
  const params = node.params || {};
  const custom = node.custom || (params.custom as Record<string, unknown>) || {};

  const animation: AnimationParams = {
    steps: [],
  };

  if (params.frame_time_ms !== undefined) animation.frame_time_ms = params.frame_time_ms as number;
  if (params.duration_ms !== undefined) animation.duration_ms = params.duration_ms as number | null;
  if (params.autoplay) animation.autoplay = true;
  if (params.loop) animation.loop = true;
  if (params.include_camera) animation.include_camera = true;
  if (params.include_canvas) animation.include_canvas = true;

  // Extract trackball spin from custom
  const trackball = custom.molstar_trackball as { name?: string; params?: { speed?: number } } | undefined;
  if (trackball?.name === 'spin') {
    animation.trackball = {
      enabled: true,
      speed: trackball.params?.speed ?? -0.05,
    };
  }

  // Convert interpolate children to steps
  if (node.children) {
    for (const child of node.children) {
      if (child.kind !== 'interpolate' || !child.params) continue;
      const p = child.params;

      const base = {
        id: nextStepId(),
        target_ref: p.target_ref as string,
        property: p.property as string,
        duration_ms: p.duration_ms as number,
        start_ms: p.start_ms as number | undefined,
      };

      const kind = p.kind as InterpolationKind;

      if (kind === 'transform_matrix') {
        const step: TransformMatrixInterpolationStep = {
          ...base,
          kind: 'transform_matrix',
          pivot: p.pivot as [number, number, number] | undefined,
          rotation_start: p.rotation_start as number[] | undefined,
          rotation_end: p.rotation_end as number[] | undefined,
          rotation_noise_magnitude: p.rotation_noise_magnitude as number | undefined,
          rotation_easing: p.rotation_easing as EasingType | undefined,
          rotation_frequency: p.rotation_frequency as number | undefined,
          rotation_alternate_direction: p.rotation_alternate_direction as boolean | undefined,
          translation_start: p.translation_start as [number, number, number] | undefined,
          translation_end: p.translation_end as [number, number, number] | undefined,
          translation_noise_magnitude: p.translation_noise_magnitude as number | undefined,
          translation_easing: p.translation_easing as EasingType | undefined,
          translation_frequency: p.translation_frequency as number | undefined,
          translation_alternate_direction: p.translation_alternate_direction as boolean | undefined,
          scale_start: p.scale_start as [number, number, number] | undefined,
          scale_end: p.scale_end as [number, number, number] | undefined,
          scale_noise_magnitude: p.scale_noise_magnitude as number | undefined,
          scale_easing: p.scale_easing as EasingType | undefined,
          scale_frequency: p.scale_frequency as number | undefined,
          scale_alternate_direction: p.scale_alternate_direction as boolean | undefined,
        };
        animation.steps.push(step);
      } else {
        const step: SimpleInterpolationStep = {
          ...base,
          kind,
          start: p.start as number | number[] | undefined,
          end: p.end as number | number[] | undefined,
          easing: p.easing as EasingType | undefined,
          frequency: p.frequency as number | undefined,
          alternate_direction: p.alternate_direction as boolean | undefined,
          discrete: p.discrete as boolean | undefined,
          noise_magnitude: p.noise_magnitude as number | undefined,
          spherical: p.spherical as boolean | undefined,
        };
        animation.steps.push(step);
      }
    }
  }

  return animation;
}

/** Extract animation nodes from a UINode array (for MVSTree import) */
export function extractAnimationFromUINodes(nodes: UINode[]): {
  nodes: UINode[];
  animation: AnimationParams | null;
} {
  const animationNodes = nodes.filter((n) => (n.kind as string) === 'animation');
  const nonAnimationNodes = nodes.filter((n) => (n.kind as string) !== 'animation');

  let animation: AnimationParams | null = null;
  if (animationNodes.length > 0) {
    const node = animationNodes[0];
    animation = convertMVSNodeToAnimationParams({
      kind: node.kind,
      params: node.params as Record<string, unknown>,
      children: (node.children || []).map((c) => ({
        kind: c.kind,
        params: c.params as Record<string, unknown>,
      })),
      custom: (node.params as Record<string, unknown>)?.custom as Record<string, unknown>,
    });
  }

  return { nodes: nonAnimationNodes, animation };
}

/** Recursively extract all ref values (with node kind) from a UINode tree */
export function extractRefsFromNodes(nodes: UINode[]): RefInfo[] {
  const refs: RefInfo[] = [];

  function traverse(node: UINode) {
    if (node.ref) refs.push({ ref: node.ref, kind: node.kind });
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return refs;
}

/** Filter refs to only those whose node kind is valid for the given interpolation kind */
export function filterRefsForKind(refs: RefInfo[], kind: InterpolationKind): RefInfo[] {
  const validKinds = VALID_REF_KINDS[kind];
  if (!validKinds) return refs;
  return refs.filter((r) => validKinds.includes(r.kind));
}

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

/** Compute total animation duration from steps (max of start_ms + duration_ms) */
export function computeAnimationDuration(steps: InterpolationStep[]): number {
  if (steps.length === 0) return 0;
  return Math.max(...steps.map((s) => (s.start_ms || 0) + s.duration_ms));
}
