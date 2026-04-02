import { describe, test, expect } from 'vitest';
import {
  composeTransformMatrix,
  decomposeTransformMatrix,
  IDENTITY_3x3,
  IDENTITY_4x4,
  eulerToMatrix,
  type Vec3,
} from '../transform-params.ts';

describe('composeTransformMatrix', () => {
  test('identity rotation + zero translation + unit scale = identity 4x4', () => {
    const result = composeTransformMatrix(IDENTITY_3x3, [0, 0, 0], [1, 1, 1]);
    expect(result).toEqual(IDENTITY_4x4);
  });

  test('translation only', () => {
    const result = composeTransformMatrix(IDENTITY_3x3, [10, 20, 30], [1, 1, 1]);
    // Column-major: last column is translation
    expect(result[12]).toBe(10);
    expect(result[13]).toBe(20);
    expect(result[14]).toBe(30);
    // Upper-left 3x3 should be identity
    expect(result[0]).toBe(1);
    expect(result[5]).toBe(1);
    expect(result[10]).toBe(1);
  });

  test('scale only', () => {
    const result = composeTransformMatrix(IDENTITY_3x3, [0, 0, 0], [2, 3, 4]);
    // Diagonal should be scale values
    expect(result[0]).toBe(2);
    expect(result[5]).toBe(3);
    expect(result[10]).toBe(4);
    expect(result[15]).toBe(1);
    // Off-diagonal of upper-left should be 0
    expect(result[1]).toBe(0);
    expect(result[4]).toBe(0);
  });

  test('non-uniform scale with rotation', () => {
    const rot = eulerToMatrix(0, 0, 90); // 90 deg around Z
    const result = composeTransformMatrix(rot, [0, 0, 0], [2, 3, 1]);
    // Column 0 should be rot_col0 * 2, column 1 should be rot_col1 * 3
    expect(result[0]).toBeCloseTo(rot[0] * 2);
    expect(result[1]).toBeCloseTo(rot[1] * 2);
    expect(result[4]).toBeCloseTo(rot[3] * 3);
    expect(result[5]).toBeCloseTo(rot[4] * 3);
  });
});

describe('decomposeTransformMatrix', () => {
  test('decomposes identity to identity components', () => {
    const { rotation, translation, scale } = decomposeTransformMatrix(IDENTITY_4x4);
    expect(scale).toEqual([1, 1, 1]);
    expect(translation).toEqual([0, 0, 0]);
    rotation.forEach((v, i) => expect(v).toBeCloseTo(IDENTITY_3x3[i]));
  });

  test('round-trip: compose then decompose', () => {
    const rot = eulerToMatrix(30, 45, 60);
    const trans: Vec3 = [5, -10, 15];
    const scl: Vec3 = [2, 0.5, 3];

    const m = composeTransformMatrix(rot, trans, scl);
    const { rotation, translation, scale } = decomposeTransformMatrix(m);

    scale.forEach((v, i) => expect(v).toBeCloseTo(scl[i]));
    translation.forEach((v, i) => expect(v).toBeCloseTo(trans[i]));
    rotation.forEach((v, i) => expect(v).toBeCloseTo(rot[i], 5));
  });

  test('extracts translation from 4x4 matrix', () => {
    const m = [...IDENTITY_4x4];
    m[12] = 7; m[13] = 8; m[14] = 9;
    const { translation } = decomposeTransformMatrix(m);
    expect(translation).toEqual([7, 8, 9]);
  });

  test('extracts non-uniform scale', () => {
    const m = [...IDENTITY_4x4];
    m[0] = 2; m[5] = 3; m[10] = 4;
    const { scale } = decomposeTransformMatrix(m);
    expect(scale).toEqual([2, 3, 4]);
  });
});
