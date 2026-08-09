import type { ComponentSelectorObject } from './types.ts';

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
