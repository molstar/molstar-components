// ============================================================
// Camera Parameter Types & Utilities
//
// Pure business logic for MVS camera nodes: types, presets,
// snapshot conversion, and import extraction.
// ============================================================

import type { CameraData } from './_lib.ts';
import { adjustedCameraPosition } from './_lib.ts';
import type { UINode } from './ui-builder.ts';
import type { Vec3 } from './transform-params.ts';

// ============================================================
// Types
// ============================================================

/** Camera parameters matching MVS camera node spec */
export interface CameraParams {
  position: [number, number, number];
  target: [number, number, number];
  up?: [number, number, number];
  ref?: string;
}

/** Camera preset definition */
export interface CameraPresetDef {
  label: string;
  description: string;
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
}

// ============================================================
// Constants
// ============================================================

export const DEFAULT_UP: Vec3 = [0, 1, 0];

export const CAMERA_PRESETS: readonly CameraPresetDef[] = [
  { label: 'Front', description: 'View from front (+Z)', position: [0, 0, 100], target: [0, 0, 0], up: [0, 1, 0] },
  { label: 'Back', description: 'View from back (-Z)', position: [0, 0, -100], target: [0, 0, 0], up: [0, 1, 0] },
  { label: 'Top', description: 'View from top (+Y)', position: [0, 100, 0], target: [0, 0, 0], up: [0, 0, -1] },
  { label: 'Bottom', description: 'View from bottom (-Y)', position: [0, -100, 0], target: [0, 0, 0], up: [0, 0, 1] },
  { label: 'Left', description: 'View from left (-X)', position: [-100, 0, 0], target: [0, 0, 0], up: [0, 1, 0] },
  { label: 'Right', description: 'View from right (+X)', position: [100, 0, 0], target: [0, 0, 0], up: [0, 1, 0] },
];

// ============================================================
// Utilities
// ============================================================

/** Check if an up vector equals the default [0, 1, 0] */
export function isDefaultUp(up: [number, number, number] | undefined): boolean {
  if (!up) return true;
  return up[0] === 0 && up[1] === 1 && up[2] === 0;
}

/**
 * Convert a Mol* camera snapshot to CameraParams with FOV adjustment.
 * Deduplicates the conversion logic used in CameraHelper, CameraSection, and SceneEditor.
 */
export function snapshotToCameraParams(snapshot: CameraData): CameraParams {
  const adjusted = adjustedCameraPosition(snapshot);
  return {
    position: [adjusted[0], adjusted[1], adjusted[2]],
    target: [
      snapshot.target[0] as number,
      snapshot.target[1] as number,
      snapshot.target[2] as number,
    ],
    up: [
      snapshot.up[0] as number,
      snapshot.up[1] as number,
      snapshot.up[2] as number,
    ],
  };
}

/**
 * Extract camera nodes from a UINode array, returning non-camera nodes and the first camera params.
 * Used during MVSTree import to route camera nodes to the dedicated CameraSection.
 */
export function extractCameraFromUINodes(nodes: UINode[]): {
  nodes: UINode[];
  camera: CameraParams | null;
} {
  const cameraNodes = nodes.filter((n) => n.kind === 'camera');
  const nonCameraNodes = nodes.filter((n) => n.kind !== 'camera');

  let camera: CameraParams | null = null;
  if (cameraNodes.length > 0) {
    const params = cameraNodes[0].params as Record<string, unknown>;
    camera = {
      position: params.position as [number, number, number],
      target: params.target as [number, number, number],
      up: params.up as [number, number, number] | undefined,
      ref: cameraNodes[0].ref,
    };
  }

  return { nodes: nonCameraNodes, camera };
}
