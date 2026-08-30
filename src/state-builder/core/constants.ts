// Constant definitions and refs for the UI builder (colors, URLs, etc.)

/**
 * Types of constants supported by the builder
 */
export type ConstantType = 'colors' | 'urls' | 'generic';

/**
 * A single key-value entry in a constant definition
 */
export interface ConstantEntry {
  key: string;
  value: string;
}

/**
 * A constant definition that can be referenced in field components
 */
export interface ConstantDefinition {
  /** Unique ID for React keys */
  id: string;
  /** Variable name for the constant (e.g., "Colors", "Urls") */
  name: string;
  /** Type of constant - affects UI rendering and validation */
  type: ConstantType;
  /** Key-value entries */
  entries: ConstantEntry[];
}

/**
 * Reference to a constant value for use in field components.
 * When a field uses a constant reference instead of a literal value,
 * the code generator will output an unquoted identifier (e.g., Colors.primary)
 */
export interface ConstantRef {
  /** Marker for type detection */
  __constantRef: true;
  /** The constant name (e.g., "Colors") */
  constantName: string;
  /** The key within the constant (e.g., "primary") */
  entryKey: string;
}

/**
 * Type guard for ConstantRef
 */
export function isConstantRef(value: unknown): value is ConstantRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__constantRef' in value &&
    (value as ConstantRef).__constantRef === true
  );
}

/**
 * Helper for creating a constant reference
 */
export function createConstantRef(constantName: string, entryKey: string): ConstantRef {
  return {
    __constantRef: true,
    constantName,
    entryKey,
  };
}

/**
 * Helper for creating an empty constant definition
 */
export function createEmptyConstant(type: ConstantType = 'generic'): ConstantDefinition {
  return {
    id: generateId(),
    name: '',
    type,
    entries: [],
  };
}

/**
 * Shared ID generator used across the core UI-node model (constants, nodes,
 * and MVS JSON conversion) — lives here since this file has no dependencies
 * of its own, avoiding an import cycle with node-types.ts / node-utils.ts.
 */
export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
