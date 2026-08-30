import type { LabeledValue } from './types.ts';

/**
 * Default chain identifiers commonly found in PDB structures.
 * Used as static fallback when structure metadata is not available.
 */
export const DEFAULT_CHAIN_IDS: readonly LabeledValue[] = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'G', label: 'G' },
  { value: 'H', label: 'H' },
] as const;

/**
 * Common ligand compound IDs frequently found in PDB structures.
 * Includes cofactors, nucleotides, and common ions.
 */
export const COMMON_LIGAND_IDS: readonly LabeledValue[] = [
  // Cofactors and prosthetic groups
  { value: 'HEM', label: 'HEM', description: 'Heme' },
  { value: 'FAD', label: 'FAD', description: 'Flavin adenine dinucleotide' },
  { value: 'FMN', label: 'FMN', description: 'Flavin mononucleotide' },
  { value: 'NAD', label: 'NAD', description: 'Nicotinamide adenine dinucleotide' },
  { value: 'NAP', label: 'NAP', description: 'NADP+' },
  // Nucleotides
  { value: 'ATP', label: 'ATP', description: 'Adenosine triphosphate' },
  { value: 'ADP', label: 'ADP', description: 'Adenosine diphosphate' },
  { value: 'GDP', label: 'GDP', description: 'Guanosine diphosphate' },
  { value: 'GTP', label: 'GTP', description: 'Guanosine triphosphate' },
  // Common ions
  { value: 'MG', label: 'MG', description: 'Magnesium ion' },
  { value: 'ZN', label: 'ZN', description: 'Zinc ion' },
  { value: 'CA', label: 'CA', description: 'Calcium ion' },
  { value: 'FE', label: 'FE', description: 'Iron ion' },
  { value: 'MN', label: 'MN', description: 'Manganese ion' },
  { value: 'CU', label: 'CU', description: 'Copper ion' },
] as const;

/**
 * Quick selection presets that map to MVS component selector strings.
 */
export const QUICK_SELECTOR_PRESETS: readonly LabeledValue[] = [
  { value: 'all', label: 'All', description: 'Select all atoms' },
  { value: 'polymer', label: 'Polymer', description: 'Proteins and nucleic acids' },
  { value: 'protein', label: 'Protein', description: 'Protein chains' },
  { value: 'nucleic', label: 'Nucleic', description: 'Nucleic acid chains' },
  { value: 'branched', label: 'Branched', description: 'Branched entities (e.g. carbohydrates)' },
  { value: 'ligand', label: 'Ligand', description: 'Small molecule ligands' },
  { value: 'ion', label: 'Ion', description: 'Metal ions' },
  { value: 'water', label: 'Water', description: 'Water molecules' },
] as const;
