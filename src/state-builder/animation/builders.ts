import type { AnimationParams, InterpolationKind, InterpolationStep, AnimationPreset } from './types.ts';
import { IDENTITY_3x3 } from '../transform/index.ts';

let _nextStepId = 1;

/** Create a unique step ID */
export function nextStepId(): string {
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

/** Compute total animation duration from steps (max of start_ms + duration_ms) */
export function computeAnimationDuration(steps: InterpolationStep[]): number {
  if (steps.length === 0) return 0;
  return Math.max(...steps.map((s) => (s.start_ms || 0) + s.duration_ms));
}
