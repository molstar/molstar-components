import type { StructureMetadata } from '../../../state-builder/index.ts';

/** Labeled value for chain/ligand options */
export interface LabeledOption {
  label: string;
  value: string;
  description?: string;
}

/** Common props for selector mode panels */
export interface SelectorPanelProps {
  metadata?: StructureMetadata | null;
  availableChains: LabeledOption[];
  availableLigands: LabeledOption[];
}

/** Chain panel state */
export interface ChainPanelState {
  selectedChain: string;
}

/** Residue panel state */
export interface ResiduePanelState {
  chain: string;
  from: string;
  to: string;
}

/** Ligand panel state */
export interface LigandPanelState {
  name: string;
  chain: string;
}

/** Raw panel state */
export interface RawPanelState {
  input: string;
  error: string;
}

/** Entry in the union selector panel */
export interface UnionEntry {
  id: string;
  chain: string;
  from: string;
  to: string;
}
