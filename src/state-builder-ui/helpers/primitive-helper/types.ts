/**
 * Primitive Helper Types
 *
 * Shared types and helpers for the primitive-helper panel components.
 */

import type { ComponentSelectorValue } from '@molstar/state-builder';

export type PositionMode = 'selector' | 'vec3' | 'expression';

/**
 * Tri-mode position state: visual selector, vec3 triple [x,y,z], or raw ComponentExpression JSON.
 * Primitive position/start/end/center fields accept all three.
 */
export interface PositionEditorState {
  mode: PositionMode;
  x: number;
  y: number;
  z: number;
  /** Raw JSON string for expression mode, e.g. '{}' or '{ "label_asym_id": "A" }' */
  expressionJson: string;
  /** Selector value for selector mode. undefined = all atoms ({}). */
  selectorValue: ComponentSelectorValue | undefined;
}

export function defaultPositionState(): PositionEditorState {
  return { mode: 'selector', x: 0, y: 0, z: 0, expressionJson: '{}', selectorValue: undefined };
}

export function positionFromParam(value: unknown): PositionEditorState {
  // vec3: [number, number, number]
  if (Array.isArray(value) && value.length === 3 && value.every((v) => typeof v === 'number')) {
    const [x, y, z] = value as [number, number, number];
    return { mode: 'vec3', x, y, z, expressionJson: '{}', selectorValue: undefined };
  }
  // Object or non-vec3 array → selector mode, pre-populate if non-empty
  if (value !== null && typeof value === 'object') {
    const isEmpty = !Array.isArray(value) && Object.keys(value as object).length === 0;
    const selectorValue: ComponentSelectorValue | undefined = isEmpty
      ? undefined
      : (value as ComponentSelectorValue);
    return { mode: 'selector', x: 0, y: 0, z: 0, expressionJson: '{}', selectorValue };
  }
  return defaultPositionState();
}

/**
 * Try to parse a string as JSON, with loose fallback that handles common
 * JavaScript object literal syntax: unquoted keys and single-quoted strings.
 * Returns `undefined` if neither form parses successfully.
 */
export function tryParseExpressionJson(str: string): unknown | undefined {
  // Strict JSON first
  try { return JSON.parse(str); } catch { /* fall through */ }
  // Loose: quote unquoted keys, convert single-quoted strings to double-quoted
  try {
    const normalized = str
      .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
      .replace(/'([^'\\]*)'/g, '"$1"');
    return JSON.parse(normalized);
  } catch { /* fall through */ }
  return undefined;
}

export function positionToParam(state: PositionEditorState): unknown {
  if (state.mode === 'vec3') {
    return [state.x, state.y, state.z];
  }
  if (state.mode === 'selector') {
    return state.selectorValue ?? {};
  }
  return tryParseExpressionJson(state.expressionJson) ?? {};
}

/** Shared props contract for ALL primitive kind field components */
export interface PrimitiveKindFieldsProps {
  params: Record<string, unknown>;
  onUpdate: (params: Record<string, unknown>) => void;
}
