import type { LabeledValue, StructureMetadata } from './types.ts';
import { DEFAULT_CHAIN_IDS, COMMON_LIGAND_IDS } from './presets.ts';

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
