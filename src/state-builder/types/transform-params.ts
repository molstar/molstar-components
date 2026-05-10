// ============================================================
// Transform Parameter Types & Utilities
//
// Pure business logic for MVS transform nodes: matrix math,
// euler conversions, rotation presets, validation, and projection.
// ============================================================

// ============================================================
// Types
// ============================================================

export type Vec3 = [number, number, number];

/** Transform parameters matching MVS spec */
export interface TransformParams {
  rotation?: number[]; // 9 values, 3x3 column-major
  translation?: [number, number, number];
  rotation_center?: 'centroid' | [number, number, number] | null;
  matrix?: number[] | null; // 16 values, 4x4 column-major
}

export interface RotationPresetDef {
  label: string;
  description: string;
  matrix: number[];
}

// ============================================================
// Constants
// ============================================================

export const IDENTITY_3x3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export const IDENTITY_4x4 = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
];

// ============================================================
// Column-major <-> Row-major conversion
// ============================================================

/** Convert 3x3 column-major flat array to row-major for visual display */
export function columnToRowMajor3(col: number[]): number[] {
  // col[j*3+i] -> row[i*3+j]
  return [
    col[0], col[3], col[6],
    col[1], col[4], col[7],
    col[2], col[5], col[8],
  ];
}

/** Convert 3x3 row-major flat array to column-major for storage */
export function rowToColumnMajor3(row: number[]): number[] {
  return [
    row[0], row[3], row[6],
    row[1], row[4], row[7],
    row[2], row[5], row[8],
  ];
}

/** Convert 4x4 column-major flat array to row-major for visual display */
export function columnToRowMajor4(col: number[]): number[] {
  const row = new Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      row[i * 4 + j] = col[j * 4 + i];
    }
  }
  return row;
}

/** Convert 4x4 row-major flat array to column-major for storage */
export function rowToColumnMajor4(row: number[]): number[] {
  const col = new Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      col[j * 4 + i] = row[i * 4 + j];
    }
  }
  return col;
}

// ============================================================
// Euler angles <-> Rotation matrix (ZYX convention)
// ============================================================

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Convert euler angles (degrees) to 3x3 rotation matrix in column-major order.
 * Convention: ZYX intrinsic (yaw around Z, then pitch around Y, then roll around X).
 * R = Rz(yaw) * Ry(pitch) * Rx(roll)
 */
export function eulerToMatrix(rollDeg: number, pitchDeg: number, yawDeg: number): number[] {
  const r = rollDeg * DEG_TO_RAD;
  const p = pitchDeg * DEG_TO_RAD;
  const y = yawDeg * DEG_TO_RAD;

  const cr = Math.cos(r), sr = Math.sin(r);
  const cp = Math.cos(p), sp = Math.sin(p);
  const cy = Math.cos(y), sy = Math.sin(y);

  // Row-major R = Rz * Ry * Rx:
  // [cy*cp,   cy*sp*sr - sy*cr,   cy*sp*cr + sy*sr]
  // [sy*cp,   sy*sp*sr + cy*cr,   sy*sp*cr - cy*sr]
  // [-sp,     cp*sr,              cp*cr            ]
  //
  // Convert to column-major (transpose):
  return [
    cy * cp,                    sy * cp,                    -sp,
    cy * sp * sr - sy * cr,     sy * sp * sr + cy * cr,     cp * sr,
    cy * sp * cr + sy * sr,     sy * sp * cr - cy * sr,     cp * cr,
  ];
}

/**
 * Decompose 3x3 column-major rotation matrix to euler angles (degrees).
 * Returns { roll, pitch, yaw } in degrees (ZYX convention).
 */
export function matrixToEuler(m: number[]): { roll: number; pitch: number; yaw: number } {
  // Column-major: m[j*3+i] = R[i][j]
  // R[2][0] = m[0*3+2] = m[2] = -sin(pitch)
  const sp = -m[2]; // -sin(pitch)

  // Clamp to handle numerical errors
  const clampedSp = Math.max(-1, Math.min(1, sp));
  const pitch = Math.asin(clampedSp) * RAD_TO_DEG;

  if (Math.abs(clampedSp) > 0.9999) {
    // Gimbal lock: pitch near +/-90 degrees
    // Set yaw = 0, compute roll from remaining elements
    const yaw = 0;
    // R[1][0] = m[0*3+1] = m[1] = sy*cp ~ sy
    // R[0][0] = m[0*3+0] = m[0] = cy*cp ~ cy
    const roll = Math.atan2(m[1], m[0]) * RAD_TO_DEG;
    return { roll, pitch, yaw };
  }

  // R[2][1] = m[1*3+2] = m[5] = cp*sr
  // R[2][2] = m[2*3+2] = m[8] = cp*cr
  const roll = Math.atan2(m[5], m[8]) * RAD_TO_DEG;

  // R[1][0] = m[0*3+1] = m[1] = sy*cp
  // R[0][0] = m[0*3+0] = m[0] = cy*cp
  const yaw = Math.atan2(m[1], m[0]) * RAD_TO_DEG;

  return { roll, pitch, yaw };
}

// ============================================================
// Rotation presets
// ============================================================

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

// ============================================================
// Validation
// ============================================================

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

// ============================================================
// 3D math & projection utilities
// ============================================================

/** Multiply 3x3 column-major matrix by a Vec3 */
export function mulMat3Vec3(m: number[], v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
    m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
    m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
  ];
}

// ============================================================
// Compose / Decompose 4x4 transform matrix
// ============================================================

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
