import type {
  StructureMetadata,
  ChainInfo,
  LigandInfo,
  ComponentSelectorValue,
  ComponentSelectorObject,
} from './types.ts';

/**
 * Narrow StructureMetadata to only elements that fall within the given selector.
 *
 * Used to provide context-aware options when editing a sub-selector (e.g. color
 * selector inside a component node) — the user only sees what is actually in scope.
 *
 * Returns the original metadata reference unchanged for selectors that cannot be
 * meaningfully filtered (unknown expression fields, unrecognised presets).
 */
export function filterMetadataBySelector(
  metadata: StructureMetadata,
  selector: ComponentSelectorValue,
): StructureMetadata {
  if (typeof selector === 'string') return filterByPreset(metadata, selector);
  if (Array.isArray(selector)) return mergeResults(selector.map(obj => filterByObject(metadata, obj)));
  return filterByObject(metadata, selector);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function filterByObject(metadata: StructureMetadata, obj: ComponentSelectorObject): StructureMetadata {
  const { label_asym_id, label_comp_id, entity_type, beg_label_seq_id, end_label_seq_id, label_seq_id } = obj;

  if (label_asym_id !== undefined) {
    const chain = metadata.chains.find(c => c.id === label_asym_id);
    if (!chain) return empty();

    const baseRange = metadata.residueRanges[label_asym_id];
    let filteredRange: { min: number; max: number } | undefined = baseRange;

    if (label_seq_id !== undefined) {
      filteredRange = { min: label_seq_id, max: label_seq_id };
    } else if (beg_label_seq_id !== undefined || end_label_seq_id !== undefined) {
      filteredRange = {
        min: beg_label_seq_id ?? baseRange?.min ?? 1,
        max: end_label_seq_id ?? baseRange?.max ?? 9999,
      };
    }

    const residueRanges: Record<string, { min: number; max: number }> = {};
    if (filteredRange) residueRanges[label_asym_id] = filteredRange;

    return {
      chains: [chain],
      ligands: metadata.ligands.filter(l => l.chainId === label_asym_id),
      residueRanges,
    };
  }

  if (label_comp_id !== undefined) {
    const ligand = metadata.ligands.find(l => l.compId === label_comp_id);
    if (!ligand) return empty();
    const chains = ligand.chainId !== undefined
      ? metadata.chains.filter(c => c.id === ligand.chainId)
      : [];
    const residueRanges: Record<string, { min: number; max: number }> = {};
    if (ligand.chainId && metadata.residueRanges[ligand.chainId]) {
      residueRanges[ligand.chainId] = metadata.residueRanges[ligand.chainId];
    }
    return { chains, ligands: [ligand], residueRanges };
  }

  if (entity_type !== undefined) return keepChainsByEntityType(metadata, entity_type);

  // Unknown expression fields — cannot narrow, return original
  return metadata;
}

function filterByPreset(metadata: StructureMetadata, preset: string): StructureMetadata {
  switch (preset) {
    case 'all': return metadata;
    case 'polymer': return keepChainsByEntityType(metadata, 'polymer');
    case 'water': return keepChainsByEntityType(metadata, 'water');
    case 'ligand': return { chains: [], ligands: metadata.ligands, residueRanges: {} };
    default: return metadata;
  }
}

function keepChainsByEntityType(metadata: StructureMetadata, type: string): StructureMetadata {
  const chains = metadata.chains.filter(c => c.entityType === type);
  const ids = new Set(chains.map(c => c.id));
  const residueRanges = Object.fromEntries(
    Object.entries(metadata.residueRanges).filter(([id]) => ids.has(id)),
  );
  const ligands = metadata.ligands.filter(l => l.chainId !== undefined && ids.has(l.chainId));
  return { chains, ligands, residueRanges };
}

function mergeResults(results: StructureMetadata[]): StructureMetadata {
  if (results.length === 0) return empty();

  const chainMap = new Map<string, { chain: ChainInfo; range?: { min: number; max: number } }>();
  const ligandMap = new Map<string, LigandInfo>();

  for (const result of results) {
    for (const chain of result.chains) {
      const range = result.residueRanges[chain.id];
      const existing = chainMap.get(chain.id);
      if (existing) {
        if (range && existing.range) {
          existing.range = {
            min: Math.min(existing.range.min, range.min),
            max: Math.max(existing.range.max, range.max),
          };
        } else if (range) {
          existing.range = range;
        }
      } else {
        chainMap.set(chain.id, { chain, range });
      }
    }
    for (const ligand of result.ligands) {
      if (!ligandMap.has(ligand.compId)) ligandMap.set(ligand.compId, ligand);
    }
  }

  const chains = Array.from(chainMap.values()).map(v => v.chain);
  const residueRanges: Record<string, { min: number; max: number }> = {};
  for (const [id, v] of chainMap) {
    if (v.range) residueRanges[id] = v.range;
  }
  return { chains, ligands: Array.from(ligandMap.values()), residueRanges };
}

function empty(): StructureMetadata {
  return { chains: [], ligands: [], residueRanges: {} };
}
