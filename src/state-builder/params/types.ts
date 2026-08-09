import type { MVSNodeParams } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';

/** Structure type parameter */
export type StructureType = NonNullable<MVSNodeParams<'structure'>['type']>;

/** Parse format parameter */
export type ParseFormat = NonNullable<MVSNodeParams<'parse'>['format']>;

/** Representation type parameter */
export type RepresentationType = NonNullable<MVSNodeParams<'representation'>['type']>;

/** Component selector (predefined) */
export type ComponentSelector = Extract<
  NonNullable<MVSNodeParams<'component'>['selector']>,
  string
>;

/** Primitive kind parameter */
export type PrimitiveKind = NonNullable<MVSNodeParams<'primitive'>['kind']>;

/** Clip type parameter */
export type ClipType = NonNullable<MVSNodeParams<'clip'>['type']>;

/** Volume representation type */
export type VolumeRepresentationType = NonNullable<
  MVSNodeParams<'volume_representation'>['type']
>;

/**
 * Labeled value with optional description (matches pattern in selector/types.ts).
 * Exported (unlike the original private interface) so options.ts and guards.ts
 * can import it — this file has no other dependencies within state-builder/.
 */
export interface LabeledValue<T extends string> {
  value: T;
  label: string;
  deprecated?: boolean;
  description?: string;
}
