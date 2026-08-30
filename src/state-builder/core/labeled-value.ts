/**
 * Labeled value with optional description — used across state-builder for
 * populating select/dropdown UI options (MVS parameter enums, chain/ligand
 * presets, etc.). Previously declared independently in both selector/ and
 * params/ with identical shape; unified here.
 */
export interface LabeledValue<T extends string = string> {
  value: T;
  label: string;
  deprecated?: boolean;
  description?: string;
}
