import type { LabeledValue, StructureType, ParseFormat, RepresentationType, PrimitiveKind } from './types.ts';
import { STRUCTURE_TYPES, PARSE_FORMATS, REPRESENTATION_TYPES, PRIMITIVE_KINDS } from './options.ts';

/**
 * Get non-deprecated values from a labeled value array.
 */
export function getActiveValues<T extends string>(
  values: readonly LabeledValue<T>[]
): readonly LabeledValue<T>[] {
  return values.filter((v) => !v.deprecated);
}

/**
 * Check if a value is valid for a given type.
 * Useful for validating imported data.
 */
export function isValidStructureType(value: unknown): value is StructureType {
  return STRUCTURE_TYPES.some((t) => t.value === value);
}

export function isValidParseFormat(value: unknown): value is ParseFormat {
  return PARSE_FORMATS.some((t) => t.value === value);
}

export function isValidRepresentationType(
  value: unknown
): value is RepresentationType {
  return REPRESENTATION_TYPES.some((t) => t.value === value);
}

export function isValidPrimitiveKind(value: unknown): value is PrimitiveKind {
  return PRIMITIVE_KINDS.some((t) => t.value === value);
}
