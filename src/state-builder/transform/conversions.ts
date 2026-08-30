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

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

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
