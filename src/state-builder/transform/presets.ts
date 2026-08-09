import type { RotationPresetDef } from './types.ts';
import { IDENTITY_3x3 } from './types.ts';
import { DEG_TO_RAD } from './conversions.ts';

/**
 * Generate rotation matrix (column-major) for angle around axis.
 */
export function rotationPreset(axis: 'x' | 'y' | 'z', angleDeg: number): number[] {
  const a = angleDeg * DEG_TO_RAD;
  const c = Math.cos(a);
  const s = Math.sin(a);

  // Round near-zero values to avoid floating point noise
  const rc = Math.abs(c) < 1e-10 ? 0 : c;
  const rs = Math.abs(s) < 1e-10 ? 0 : s;

  switch (axis) {
    case 'x':
      // Column-major Rx
      return [1, 0, 0, 0, rc, rs, 0, -rs, rc];
    case 'y':
      // Column-major Ry
      return [rc, 0, -rs, 0, 1, 0, rs, 0, rc];
    case 'z':
      // Column-major Rz
      return [rc, rs, 0, -rs, rc, 0, 0, 0, 1];
  }
}

export const ROTATION_PRESETS: RotationPresetDef[] = [
  { label: 'Identity', description: 'No rotation', matrix: IDENTITY_3x3 },
  { label: '90 X', description: '90 degrees around X axis', matrix: rotationPreset('x', 90) },
  { label: '180 X', description: '180 degrees around X axis', matrix: rotationPreset('x', 180) },
  { label: '270 X', description: '270 degrees around X axis', matrix: rotationPreset('x', 270) },
  { label: '90 Y', description: '90 degrees around Y axis', matrix: rotationPreset('y', 90) },
  { label: '180 Y', description: '180 degrees around Y axis', matrix: rotationPreset('y', 180) },
  { label: '270 Y', description: '270 degrees around Y axis', matrix: rotationPreset('y', 270) },
  { label: '90 Z', description: '90 degrees around Z axis', matrix: rotationPreset('z', 90) },
  { label: '180 Z', description: '180 degrees around Z axis', matrix: rotationPreset('z', 180) },
  { label: '270 Z', description: '270 degrees around Z axis', matrix: rotationPreset('z', 270) },
];
