import type {
  AnimationParams,
  InterpolationKind,
  EasingType,
  SimpleInterpolationStep,
  TransformMatrixInterpolationStep,
} from './types.ts';
import type { UINode } from '../core/index.ts';
import { IDENTITY_3x3 } from '../transform/index.ts';
import { nextStepId } from './builders.ts';

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
      ...(params.custom ?? {}),
      molstar_trackball: {
        name: 'spin',
        params: { speed: params.trackball.speed },
      },
    };
  } else if (params.custom && Object.keys(params.custom).length > 0) {
    custom = params.custom;
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

  // Preserve raw custom data
  if (Object.keys(custom).length > 0) {
    animation.custom = custom as Record<string, unknown>;
  }

  // Extract trackball spin from custom (only 'spin' is representable in the UI)
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
      custom: node.custom as Record<string, unknown> | undefined,
    });
  }

  return { nodes: nonAnimationNodes, animation };
}
