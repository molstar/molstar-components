import type {
  LabeledValue,
  StructureType,
  ParseFormat,
  RepresentationType,
  ComponentSelector,
  PrimitiveKind,
  ClipType,
  VolumeRepresentationType,
} from './types.ts';
import type { MVSNodeParams } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';

/**
 * Structure types with labels.
 * TypeScript will error if StructureType changes in MVS.
 */
export const STRUCTURE_TYPES: readonly LabeledValue<StructureType>[] = [
  { value: 'model', label: 'Model', description: 'Original model coordinates' },
  { value: 'assembly', label: 'Assembly', description: 'Biological assembly' },
  { value: 'symmetry', label: 'Symmetry', description: 'Crystal unit cells' },
  {
    value: 'symmetry_mates',
    label: 'Symmetry Mates',
    description: 'Asymmetric units within radius',
  },
] as const;

/**
 * Parse formats with labels.
 * TypeScript will error if ParseFormat changes in MVS.
 */
export const PARSE_FORMATS: readonly LabeledValue<ParseFormat>[] = [
  { value: 'bcif', label: 'BCIF', description: 'Binary CIF (compressed)' },
  { value: 'mmcif', label: 'mmCIF', description: 'Macromolecular CIF' },
  { value: 'pdb', label: 'PDB', description: 'Protein Data Bank format' },
] as const;

/**
 * Representation types with labels.
 * TypeScript will error if RepresentationType changes in MVS.
 */
export const REPRESENTATION_TYPES: readonly LabeledValue<RepresentationType>[] =
  [
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'backbone', label: 'Backbone' },
    { value: 'ball_and_stick', label: 'Ball and Stick' },
    { value: 'spacefill', label: 'Spacefill' },
    { value: 'surface', label: 'Surface' },
    { value: 'line', label: 'Line' },
    { value: 'carbohydrate', label: 'Carbohydrate' },
  ] as const;

/**
 * Component selectors (predefined keywords).
 * TypeScript will error if ComponentSelector changes in MVS.
 */
export const COMPONENT_SELECTORS: readonly LabeledValue<ComponentSelector>[] = [
  { value: 'all', label: 'All' },
  { value: 'polymer', label: 'Polymer' },
  { value: 'protein', label: 'Protein' },
  { value: 'nucleic', label: 'Nucleic' },
  { value: 'branched', label: 'Branched' },
  { value: 'ligand', label: 'Ligand' },
  { value: 'ion', label: 'Ion' },
  { value: 'water', label: 'Water' },
  { value: 'coarse', label: 'Coarse' },
] as const;

/**
 * Primitive kinds with labels.
 * TypeScript will error if PrimitiveKind changes in MVS.
 */
export const PRIMITIVE_KINDS: readonly LabeledValue<PrimitiveKind>[] = [
  { value: 'mesh', label: 'Mesh' },
  { value: 'lines', label: 'Lines' },
  { value: 'tube', label: 'Tube' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'distance_measurement', label: 'Distance Measurement' },
  { value: 'angle_measurement', label: 'Angle Measurement' },
  { value: 'label', label: 'Label' },
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'ellipsoid', label: 'Ellipsoid' },
  { value: 'box', label: 'Box' },
] as const;

/**
 * Label attachment positions for the primitives container.
 * TypeScript will error if LabelAttachment changes in MVS.
 */
export type LabelAttachment = NonNullable<MVSNodeParams<'primitives'>['label_attachment']>;

export const LABEL_ATTACHMENT_OPTIONS: readonly LabeledValue<LabelAttachment>[] = [
  { value: 'bottom-left',   label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right',  label: 'Bottom Right' },
  { value: 'middle-left',   label: 'Middle Left' },
  { value: 'middle-center', label: 'Middle Center' },
  { value: 'middle-right',  label: 'Middle Right' },
  { value: 'top-left',      label: 'Top Left' },
  { value: 'top-center',    label: 'Top Center' },
  { value: 'top-right',     label: 'Top Right' },
] as const;

/**
 * Clip types with labels.
 */
export const CLIP_TYPES: readonly LabeledValue<ClipType>[] = [
  { value: 'plane', label: 'Plane' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'box', label: 'Box' },
] as const;

/**
 * Volume representation types with labels.
 */
export const VOLUME_REPRESENTATION_TYPES: readonly LabeledValue<VolumeRepresentationType>[] =
  [
    { value: 'isosurface', label: 'Isosurface' },
    { value: 'grid_slice', label: 'Grid Slice' },
  ] as const;

/**
 * Molstar color theme names.
 * These are used in custom.molstar_color_theme_name, not MVS params.
 * Source: Molstar's representation color theme registry
 */
export const MOLSTAR_COLOR_THEMES = [
  { value: 'element-symbol', label: 'Element Symbol' },
  { value: 'chain-id', label: 'Chain ID' },
  { value: 'entity-id', label: 'Entity ID' },
  { value: 'entity-source', label: 'Entity Source' },
  { value: 'model-index', label: 'Model Index' },
  { value: 'residue-name', label: 'Residue Name' },
  { value: 'secondary-structure', label: 'Secondary Structure' },
  { value: 'sequence-id', label: 'Sequence ID' },
  { value: 'molecule-type', label: 'Molecule Type' },
  { value: 'hydrophobicity', label: 'Hydrophobicity' },
  { value: 'uniform', label: 'Uniform' },
] as const;

export type MolstarColorTheme = (typeof MOLSTAR_COLOR_THEMES)[number]['value'];

/**
 * Carbon color options for element-symbol theme.
 */
export const CARBON_COLOR_OPTIONS = [
  { value: 'element-symbol', label: 'Element Symbol (default)' },
  { value: 'uniform', label: 'Uniform (custom color)' },
] as const;

export type CarbonColorOption = (typeof CARBON_COLOR_OPTIONS)[number]['value'];
