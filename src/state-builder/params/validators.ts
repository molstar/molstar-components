import { isValidStructureType, isValidParseFormat, isValidRepresentationType } from './guards.ts';
import { STRUCTURE_TYPES, PARSE_FORMATS, REPRESENTATION_TYPES } from './options.ts';

/**
 * Validate structure params at runtime.
 * Returns validation errors if any.
 */
export function validateStructureParams(
  params: Record<string, unknown>
): string[] {
  const errors: string[] = [];

  if (params.type !== undefined && !isValidStructureType(params.type)) {
    errors.push(
      `Invalid structure type: "${params.type}". Valid types: ${STRUCTURE_TYPES.map((t) => t.value).join(', ')}`
    );
  }

  return errors;
}

/**
 * Validate parse params at runtime.
 */
export function validateParseParams(
  params: Record<string, unknown>
): string[] {
  const errors: string[] = [];

  if (params.format !== undefined && !isValidParseFormat(params.format)) {
    errors.push(
      `Invalid parse format: "${params.format}". Valid formats: ${PARSE_FORMATS.map((t) => t.value).join(', ')}`
    );
  }

  return errors;
}

/**
 * Validate representation params at runtime.
 */
export function validateRepresentationParams(
  params: Record<string, unknown>
): string[] {
  const errors: string[] = [];

  if (params.type !== undefined && !isValidRepresentationType(params.type)) {
    errors.push(
      `Invalid representation type: "${params.type}". Valid types: ${REPRESENTATION_TYPES.map((t) => t.value).join(', ')}`
    );
  }

  return errors;
}
