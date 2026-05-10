/**
 * Hook for extracting structure metadata from Mol* plugin.
 *
 * This file contains the Mol*-specific extraction logic.
 * The pure metadata building functions are in state-builder.
 */

import {
  buildStructureMetadata,
  type RawChainData,
  type RawLigandData,
  type StructureMetadata,
} from '@molstar/state-builder';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects';
import { Structure } from 'molstar/lib/mol-model/structure';

/**
 * Extract structure metadata from Mol* plugin's loaded structures.
 * Returns null if no structures are loaded.
 *
 * This extracts ALL chains and ligands from the underlying models,
 * not just those visible in the current structure subset.
 */
export function extractMetadataFromPlugin(plugin: PluginUIContext): StructureMetadata | null {
  const structures: Structure[] = [];

  try {
    // Get structures from the state tree by iterating over cells
    const cells = plugin.state.data.cells;
    cells.forEach((cell) => {
      if (
        cell.obj &&
        PluginStateObject.Molecule.Structure.is(cell.obj) &&
        cell.obj.data
      ) {
        structures.push(cell.obj.data);
      }
    });
  } catch (e) {
    console.warn('Error accessing plugin structures:', e);
    return null;
  }

  if (structures.length === 0) {
    return null;
  }

  const rawChains: RawChainData[] = [];
  const rawLigands: RawLigandData[] = [];
  const seenChains = new Set<string>();
  const seenLigands = new Set<string>();

  for (const structure of structures) {
    try {
      // Get all models from the structure
      const models = structure.models;
      if (!models || models.length === 0) continue;

      // Process each model
      for (const model of models) {
        const { atomicHierarchy, entities } = model;
        const { chains, residues, atoms } = atomicHierarchy;

        // Iterate through ALL chains in the model's chains table
        const chainCount = chains._rowCount;

        for (let chainIdx = 0; chainIdx < chainCount; chainIdx++) {
          const chainId = chains.label_asym_id.value(chainIdx);
          const entityId = chains.label_entity_id.value(chainIdx);

          // Skip if already seen
          if (seenChains.has(chainId)) continue;
          seenChains.add(chainId);

          // Get entity type
          const entityIndex = entities.getEntityIndex(entityId);
          const entityType =
            entityIndex >= 0 ? entities.data.type.value(entityIndex) : undefined;

          // For residue ranges, we need to find residues belonging to this chain
          // Use the chainAtomSegments to get atom range, then map to residues
          let minSeqId: number | undefined;
          let maxSeqId: number | undefined;
          const ligandCompIds = new Set<string>();

          try {
            const { chainAtomSegments, residueAtomSegments } = atomicHierarchy;
            const atomStart = chainAtomSegments.offsets[chainIdx];
            const atomEnd = chainAtomSegments.offsets[chainIdx + 1];

            const seenResidues = new Set<number>();
            for (let atomIdx = atomStart; atomIdx < atomEnd; atomIdx++) {
              const resIdx = residueAtomSegments.index[atomIdx];
              if (seenResidues.has(resIdx)) continue;
              seenResidues.add(resIdx);

              const seqId = residues.label_seq_id.value(resIdx);
              // label_comp_id is on atoms table, not residues
              const compId = atoms.label_comp_id.value(atomIdx);

              if (seqId > 0) {
                if (minSeqId === undefined || seqId < minSeqId) minSeqId = seqId;
                if (maxSeqId === undefined || seqId > maxSeqId) maxSeqId = seqId;
              }

              if (entityType === 'non-polymer' || entityType === 'branched') {
                ligandCompIds.add(compId);
              }
            }
          } catch {
            // If residue range extraction fails, still add the chain without range info
          }

          rawChains.push({
            labelAsymId: chainId,
            entityType: entityType,
            minSeqId,
            maxSeqId,
          });

          // Add ligands for this chain
          for (const compId of ligandCompIds) {
            const ligandKey = `${compId}:${chainId}`;
            if (!seenLigands.has(ligandKey)) {
              seenLigands.add(ligandKey);
              rawLigands.push({
                compId: compId,
                chainId: chainId,
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error extracting metadata from structure:', e);
    }
  }

  if (rawChains.length === 0) {
    return null;
  }

  return buildStructureMetadata(rawChains, rawLigands);
}

/**
 * Check if the plugin has any loaded structures.
 */
export function hasLoadedStructures(plugin: PluginUIContext): boolean {
  try {
    const cells = plugin.state.data.cells;
    let hasStructure = false;
    cells.forEach((cell) => {
      if (cell.obj && PluginStateObject.Molecule.Structure.is(cell.obj)) {
        hasStructure = true;
      }
    });
    return hasStructure;
  } catch {
    return false;
  }
}
