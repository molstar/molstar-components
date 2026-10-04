export type { LabeledValue } from '../core/index.ts';

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
  beg_auth_seq_id?: number;
  end_auth_seq_id?: number;
}

/**
 * Type representing all valid selector formats:
 * - string preset (e.g., 'all', 'polymer')
 * - object selector (e.g., { label_asym_id: 'A' })
 * - array of selectors for union (e.g., [{ label_asym_id: 'A' }, { label_asym_id: 'B' }])
 */
export type ComponentSelectorValue = string | ComponentSelectorObject | ComponentSelectorObject[] | MolqlSelectorValue;

/**
 * Pre-compiled MolQL expression wrapper, as introduced by Mol* for MolViewSpec selectors.
 * `molql` holds a serialized MolScript `Expression` (an `Apply` node) generated externally
 * (via `MolScriptBuilder` or a transpiler) — never hand-written in this UI.
 * `structure_ref` is only meaningful on primitive positions, referencing a different loaded structure.
 */
export interface MolqlSelectorValue {
  molql: unknown;
  structure_ref?: string;
}

/**
 * Selection mode for the selector builder UI
 */
export type SelectorBuilderMode = 'chain' | 'residue' | 'ligand' | 'quick' | 'raw' | 'union' | 'expression' | 'molql';

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
