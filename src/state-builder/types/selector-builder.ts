/**
 * Selector Builder Types and Utilities
 *
 * Provides types, constants, and helper functions for building MVS component selectors.
 * Used by the SelectorHelper UI component.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Labeled value with optional description (matches pattern in mvs-params.ts)
 */
export interface LabeledValue<T extends string = string> {
  value: T;
  label: string;
  deprecated?: boolean;
  description?: string;
}

/**
 * Common properties for MVS component selector objects.
 * These correspond to the selector fields in MVS ComponentExpression.
 */
export interface ComponentSelectorObject {
  label_asym_id?: string;
  label_seq_id?: number;
  beg_label_seq_id?: number;
  end_label_seq_id?: number;
  label_comp_id?: string;
  entity_type?: string;
  auth_asym_id?: string;
  auth_seq_id?: number;
}

/**
 * Type representing all valid selector formats:
 * - string preset (e.g., 'all', 'polymer')
 * - object selector (e.g., { label_asym_id: 'A' })
 * - array of selectors for union (e.g., [{ label_asym_id: 'A' }, { label_asym_id: 'B' }])
 */
export type ComponentSelectorValue = string | ComponentSelectorObject | ComponentSelectorObject[];

/**
 * Selection mode for the selector builder UI
 */
export type SelectorBuilderMode = 'chain' | 'residue' | 'ligand' | 'quick' | 'raw' | 'union' | 'expression';

/**
 * Structure metadata for dynamic selector population.
 * Optional - when not provided, static defaults are used.
 */
export interface StructureMetadata {
  chains: ChainInfo[];
  ligands: LigandInfo[];
  residueRanges: Record<string, { min: number; max: number }>;
}

export interface ChainInfo {
  id: string;
  entityType?: 'polymer' | 'non-polymer' | 'water';
  residueCount?: number;
}

export interface LigandInfo {
  compId: string;
  chainId?: string;
  name?: string;
}

// =============================================================================
// Constants
// =============================================================================

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

// =============================================================================
// Selector Building Utilities
// =============================================================================

/**
 * Build a chain selector object.
 */
export function buildChainSelector(chainId: string): ComponentSelectorObject {
  return { label_asym_id: chainId };
}

/**
 * Build a residue range selector object.
 * If only `from` is provided, selects a single residue.
 */
export function buildResidueSelector(
  chainId: string,
  from: number,
  to?: number
): ComponentSelectorObject {
  if (to !== undefined && to !== from) {
    return {
      label_asym_id: chainId,
      beg_label_seq_id: from,
      end_label_seq_id: to,
    };
  }
  return {
    label_asym_id: chainId,
    label_seq_id: from,
  };
}

/**
 * Build a ligand selector object.
 * Optionally filter by chain.
 */
export function buildLigandSelector(compId: string, chainId?: string): ComponentSelectorObject {
  if (chainId) {
    return { label_asym_id: chainId, label_comp_id: compId };
  }
  return { label_comp_id: compId };
}

/**
 * Build a union selector from multiple selectors.
 */
export function buildUnionSelector(
  selectors: ComponentSelectorObject[]
): ComponentSelectorObject[] {
  return selectors;
}

// =============================================================================
// Selector Parsing Utilities
// =============================================================================

/**
 * Result of parsing a selector value.
 */
export interface ParsedSelector {
  mode: SelectorBuilderMode;
  chainId?: string;
  residueFrom?: number;
  residueTo?: number;
  ligandName?: string;
  ligandChain?: string;
  rawValue?: string;
  unionEntries?: { chain: string; from?: number; to?: number }[];
  expressionValue?: ComponentSelectorObject;
}

/**
 * Parse a selector value to determine its type and extract components.
 * Used to populate the selector builder UI from an existing selector.
 */
export function parseSelector(value: unknown): ParsedSelector {
  // String selector (preset or custom)
  if (typeof value === 'string') {
    return { mode: 'raw', rawValue: value };
  }

  // Array selector → union mode
  if (Array.isArray(value)) {
    const entries = (value as ComponentSelectorObject[]).map((obj) => ({
      chain: obj.label_asym_id ?? '',
      from: obj.beg_label_seq_id ?? obj.label_seq_id,
      to: obj.end_label_seq_id,
    }));
    return { mode: 'union', unionEntries: entries };
  }

  // Object selector
  if (typeof value === 'object' && value !== null) {
    const obj = value as ComponentSelectorObject;

    // Ligand selector (has label_comp_id, no residue fields)
    if (obj.label_comp_id && !obj.beg_label_seq_id && !obj.label_seq_id) {
      return {
        mode: 'ligand',
        ligandName: obj.label_comp_id,
        ligandChain: obj.label_asym_id,
      };
    }

    // Residue range selector
    if (obj.beg_label_seq_id !== undefined || obj.label_seq_id !== undefined) {
      return {
        mode: 'residue',
        chainId: obj.label_asym_id,
        residueFrom: obj.beg_label_seq_id ?? obj.label_seq_id,
        residueTo: obj.end_label_seq_id,
      };
    }

    // Chain selector (only label_asym_id, no other fields)
    if (obj.label_asym_id && Object.keys(obj).length === 1) {
      return {
        mode: 'chain',
        chainId: obj.label_asym_id,
      };
    }

    // Any other object with fields → expression mode
    if (Object.keys(obj).length > 0) {
      return { mode: 'expression', expressionValue: obj };
    }
  }

  // Unknown format - fall back to raw
  return {
    mode: 'raw',
    rawValue: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? ''),
  };
}

/**
 * Serialize a selector value to a display string.
 */
export function selectorToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

/**
 * Validate and parse a raw selector string input.
 * Returns the parsed value or null if invalid.
 */
export function parseRawSelectorInput(input: string): { value: unknown; error?: string } {
  const trimmed = input.trim();

  if (!trimmed) {
    return { value: null, error: 'Empty input' };
  }

  // Try JSON parse for objects/arrays
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return { value: JSON.parse(trimmed) };
    } catch {
      return { value: null, error: 'Invalid JSON syntax' };
    }
  }

  // Treat as string literal (preset like 'all', 'polymer', etc.)
  return { value: trimmed };
}

/**
 * Format selector value for compact human-readable display.
 */
export function formatSelectorPreview(selector: unknown): string {
  if (!selector) return 'Click to configure...';
  if (typeof selector === 'string') return selector;
  if (typeof selector === 'object' && !Array.isArray(selector)) {
    const obj = selector as ComponentSelectorObject;
    if (obj.label_asym_id && obj.label_comp_id) {
      return `Chain ${obj.label_asym_id}: ${obj.label_comp_id}`;
    }
    if (obj.label_comp_id) {
      return `Ligand: ${obj.label_comp_id}`;
    }
    if (obj.beg_label_seq_id && obj.end_label_seq_id) {
      return `Chain ${obj.label_asym_id}: ${obj.beg_label_seq_id}-${obj.end_label_seq_id}`;
    }
    if (obj.label_seq_id) {
      return `Chain ${obj.label_asym_id}: ${obj.label_seq_id}`;
    }
    if (obj.label_asym_id) {
      return `Chain ${obj.label_asym_id}`;
    }
    return JSON.stringify(selector);
  }
  if (Array.isArray(selector)) {
    return `Union (${selector.length} selectors)`;
  }
  return String(selector);
}

// =============================================================================
// Dynamic Metadata Helpers
// =============================================================================

/**
 * Merge static defaults with dynamic structure metadata.
 * Returns chains from metadata if available, otherwise defaults.
 */
export function getAvailableChains(metadata?: StructureMetadata): LabeledValue[] {
  if (metadata?.chains && metadata.chains.length > 0) {
    return metadata.chains.map((c) => ({
      value: c.id,
      label: c.id,
      description: c.entityType ? `${c.entityType}${c.residueCount ? ` (${c.residueCount} residues)` : ''}` : undefined,
    }));
  }
  return [...DEFAULT_CHAIN_IDS];
}

/**
 * Merge static defaults with dynamic structure metadata.
 * Returns ligands from metadata if available, merged with common defaults.
 */
export function getAvailableLigands(metadata?: StructureMetadata): LabeledValue[] {
  if (metadata?.ligands && metadata.ligands.length > 0) {
    // Create a set of ligands from the structure
    const structureLigands = metadata.ligands.map((l) => ({
      value: l.compId,
      label: l.compId,
      description: l.name || (l.chainId ? `Chain ${l.chainId}` : undefined),
    }));

    // Deduplicate by value
    const seen = new Set<string>();
    return structureLigands.filter((l) => {
      if (seen.has(l.value)) return false;
      seen.add(l.value);
      return true;
    });
  }
  return [...COMMON_LIGAND_IDS];
}

/**
 * Get residue range for a chain from metadata.
 */
export function getResidueRange(
  chainId: string,
  metadata?: StructureMetadata
): { min: number; max: number } | undefined {
  return metadata?.residueRanges?.[chainId];
}
