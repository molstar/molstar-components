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

export const IDENTITY_3x3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export const IDENTITY_4x4 = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
];
