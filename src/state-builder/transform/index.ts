export type { Vec3, TransformParams, RotationPresetDef } from './types.ts';
export { IDENTITY_3x3, IDENTITY_4x4 } from './types.ts';

export {
  columnToRowMajor3,
  rowToColumnMajor3,
  columnToRowMajor4,
  rowToColumnMajor4,
  eulerToMatrix,
  matrixToEuler,
} from './conversions.ts';

export { rotationPreset, ROTATION_PRESETS } from './presets.ts';

export {
  isValidRotationMatrix,
  mulMat3Vec3,
  composeTransformMatrix,
  decomposeTransformMatrix,
  projectIsometric,
} from './matrix.ts';
