import type { Vec3 } from './types.ts';

/**
 * Check if a 9-element array is a valid rotation matrix (orthogonal, det ~= 1).
 */
export function isValidRotationMatrix(m: number[]): boolean {
  if (m.length !== 9) return false;

  // Check for NaN
  if (m.some(v => isNaN(v))) return false;

  // Column-major: columns are m[0..2], m[3..5], m[6..8]
  const c0 = [m[0], m[1], m[2]];
  const c1 = [m[3], m[4], m[5]];
  const c2 = [m[6], m[7], m[8]];

  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = (a: number[]) => Math.sqrt(dot(a, a));

  const eps = 0.01;

  // Columns should be unit length
  if (Math.abs(len(c0) - 1) > eps) return false;
  if (Math.abs(len(c1) - 1) > eps) return false;
  if (Math.abs(len(c2) - 1) > eps) return false;

  // Columns should be orthogonal
  if (Math.abs(dot(c0, c1)) > eps) return false;
  if (Math.abs(dot(c0, c2)) > eps) return false;
  if (Math.abs(dot(c1, c2)) > eps) return false;

  // Determinant should be 1 (not -1, which would be a reflection)
  const det =
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[3] * (m[1] * m[8] - m[2] * m[7]) +
    m[6] * (m[1] * m[5] - m[2] * m[4]);

  if (Math.abs(det - 1) > eps) return false;

  return true;
}

/** Multiply 3x3 column-major matrix by a Vec3 */
export function mulMat3Vec3(m: number[], v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
    m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
    m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
  ];
}

/**
 * Compose a 4x4 column-major transform matrix from rotation, translation, and scale.
 * Order: M = T × R × S (scale applied first, then rotation, then translation).
 *
 * @param rotation 9-element column-major 3x3 rotation matrix
 * @param translation [x, y, z] translation vector
 * @param scale [sx, sy, sz] per-axis scale factors
 * @returns 16-element column-major 4x4 matrix
 */
export function composeTransformMatrix(rotation: number[], translation: Vec3, scale: Vec3): number[] {
  // M = T * R * S
  // In column-major 4x4:
  //   col0 = R_col0 * sx
  //   col1 = R_col1 * sy
  //   col2 = R_col2 * sz
  //   col3 = [tx, ty, tz, 1]
  const [sx, sy, sz] = scale;
  const [tx, ty, tz] = translation;
  return [
    rotation[0] * sx, rotation[1] * sx, rotation[2] * sx, 0,
    rotation[3] * sy, rotation[4] * sy, rotation[5] * sy, 0,
    rotation[6] * sz, rotation[7] * sz, rotation[8] * sz, 0,
    tx, ty, tz, 1,
  ];
}

/**
 * Decompose a 4x4 column-major transform matrix into rotation, translation, and scale.
 * Assumes M = T × R × S (no shear). Scale is extracted as column lengths,
 * rotation as normalized columns.
 *
 * @param m 16-element column-major 4x4 matrix
 * @returns { rotation: 9-element col-major 3x3, translation: Vec3, scale: Vec3 }
 */
export function decomposeTransformMatrix(m: number[]): {
  rotation: number[];
  translation: Vec3;
  scale: Vec3;
} {
  // Column vectors of the upper-left 3x3
  const c0 = [m[0], m[1], m[2]];
  const c1 = [m[4], m[5], m[6]];
  const c2 = [m[8], m[9], m[10]];

  const len = (v: number[]) => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

  const sx = len(c0);
  const sy = len(c1);
  const sz = len(c2);

  const scale: Vec3 = [sx, sy, sz];
  const translation: Vec3 = [m[12], m[13], m[14]];

  // Normalize columns to get rotation (guard against zero scale)
  const invSx = sx > 1e-12 ? 1 / sx : 0;
  const invSy = sy > 1e-12 ? 1 / sy : 0;
  const invSz = sz > 1e-12 ? 1 / sz : 0;

  const rotation = [
    c0[0] * invSx, c0[1] * invSx, c0[2] * invSx,
    c1[0] * invSy, c1[1] * invSy, c1[2] * invSy,
    c2[0] * invSz, c2[1] * invSz, c2[2] * invSz,
  ];

  return { rotation, translation, scale };
}

/** Isometric projection: 3D -> 2D */
export function projectIsometric(p: Vec3): [number, number] {
  // Standard isometric angles
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);
  const x = (p[0] - p[2]) * cos30;
  const y = -p[1] + (p[0] + p[2]) * sin30;
  return [x, y];
}
