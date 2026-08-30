/**
 * Structure Metadata Extraction Utilities
 *
 * Pure functions for building StructureMetadata from raw extracted data.
 * These functions have no Mol* dependencies - the actual extraction
 * from Mol* structures happens in the webapp layer.
 */

import type { StructureMetadata, ChainInfo, LigandInfo } from './types.ts';

/**
 * Raw chain data extracted from a Mol* structure.
 * This is the intermediate format before building StructureMetadata.
 */
export interface RawChainData {
  labelAsymId: string;
  authAsymId?: string;
  entityType?: string;
  minSeqId?: number;
  maxSeqId?: number;
}

/**
 * Raw ligand data extracted from a Mol* structure.
 */
export interface RawLigandData {
  compId: string;
  chainId?: string;
  name?: string;
}

/**
 * Build StructureMetadata from raw extracted data.
 * Handles deduplication, sorting, and formatting for UI consumption.
 */
export function buildStructureMetadata(
  rawChains: RawChainData[],
  rawLigands: RawLigandData[]
): StructureMetadata {
  // Deduplicate chains by labelAsymId, merge residue ranges
  const chainMap = new Map<string, ChainInfo & { minSeq?: number; maxSeq?: number }>();

  for (const raw of rawChains) {
    const existing = chainMap.get(raw.labelAsymId);
    if (existing) {
      // Merge residue ranges
      if (raw.minSeqId !== undefined) {
        existing.minSeq = Math.min(existing.minSeq ?? raw.minSeqId, raw.minSeqId);
      }
      if (raw.maxSeqId !== undefined) {
        existing.maxSeq = Math.max(existing.maxSeq ?? raw.maxSeqId, raw.maxSeqId);
      }
    } else {
      chainMap.set(raw.labelAsymId, {
        id: raw.labelAsymId,
        entityType: raw.entityType as ChainInfo['entityType'],
        minSeq: raw.minSeqId,
        maxSeq: raw.maxSeqId,
      });
    }
  }

  // Build chains array sorted alphabetically
  const chains: ChainInfo[] = Array.from(chainMap.values())
    .map(({ id, entityType }) => ({ id, entityType }))
    .sort((a, b) => a.id.localeCompare(b.id));

  // Build residue ranges from chain data
  const residueRanges: Record<string, { min: number; max: number }> = {};
  for (const [chainId, data] of chainMap) {
    if (data.minSeq !== undefined && data.maxSeq !== undefined) {
      residueRanges[chainId] = { min: data.minSeq, max: data.maxSeq };
    }
  }

  // Deduplicate ligands by compId (keep first occurrence's chain)
  const ligandMap = new Map<string, LigandInfo>();
  for (const raw of rawLigands) {
    if (!ligandMap.has(raw.compId)) {
      ligandMap.set(raw.compId, {
        compId: raw.compId,
        chainId: raw.chainId,
        name: raw.name,
      });
    }
  }

  // Build ligands array sorted by compId
  const ligands: LigandInfo[] = Array.from(ligandMap.values()).sort((a, b) =>
    a.compId.localeCompare(b.compId)
  );

  return { chains, ligands, residueRanges };
}

/**
 * Merge multiple StructureMetadata objects into one.
 * Useful when multiple structures are loaded.
 */
export function mergeStructureMetadata(metadataList: StructureMetadata[]): StructureMetadata {
  if (metadataList.length === 0) {
    return { chains: [], ligands: [], residueRanges: {} };
  }

  if (metadataList.length === 1) {
    return metadataList[0];
  }

  // Collect all raw data and rebuild
  const allChains: RawChainData[] = [];
  const allLigands: RawLigandData[] = [];

  for (const metadata of metadataList) {
    for (const chain of metadata.chains) {
      const range = metadata.residueRanges[chain.id];
      allChains.push({
        labelAsymId: chain.id,
        entityType: chain.entityType,
        minSeqId: range?.min,
        maxSeqId: range?.max,
      });
    }

    for (const ligand of metadata.ligands) {
      allLigands.push({
        compId: ligand.compId,
        chainId: ligand.chainId,
        name: ligand.name,
      });
    }
  }

  return buildStructureMetadata(allChains, allLigands);
}
