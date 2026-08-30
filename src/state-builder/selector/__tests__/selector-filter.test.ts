import { describe, test, expect } from 'vitest';
import { filterMetadataBySelector, type StructureMetadata } from '../index.ts';

const META: StructureMetadata = {
  chains: [
    { id: 'A', entityType: 'polymer' },
    { id: 'B', entityType: 'polymer' },
    { id: 'C', entityType: 'non-polymer' },
    { id: 'W', entityType: 'water' },
  ],
  ligands: [
    { compId: 'HEM', chainId: 'C' },
    { compId: 'ATP', chainId: 'A' },
  ],
  residueRanges: {
    A: { min: 1, max: 100 },
    B: { min: 1, max: 200 },
  },
};

describe('filterMetadataBySelector', () => {
  describe('chain object selector', () => {
    test('keeps only the matching chain and its residueRange', () => {
      const r = filterMetadataBySelector(META, { label_asym_id: 'A' });
      expect(r.chains).toEqual([{ id: 'A', entityType: 'polymer' }]);
      expect(r.residueRanges).toEqual({ A: { min: 1, max: 100 } });
    });

    test('keeps ligands on the matching chain', () => {
      const r = filterMetadataBySelector(META, { label_asym_id: 'A' });
      expect(r.ligands).toEqual([{ compId: 'ATP', chainId: 'A' }]);
    });

    test('returns empty result when chain not in metadata', () => {
      const r = filterMetadataBySelector(META, { label_asym_id: 'X' });
      expect(r.chains).toHaveLength(0);
      expect(r.ligands).toHaveLength(0);
      expect(r.residueRanges).toEqual({});
    });

    test('clamps residueRange to beg/end when specified', () => {
      const r = filterMetadataBySelector(META, {
        label_asym_id: 'A',
        beg_label_seq_id: 20,
        end_label_seq_id: 30,
      });
      expect(r.residueRanges).toEqual({ A: { min: 20, max: 30 } });
    });

    test('uses label_seq_id as both min and max', () => {
      const r = filterMetadataBySelector(META, { label_asym_id: 'A', label_seq_id: 25 });
      expect(r.residueRanges).toEqual({ A: { min: 25, max: 25 } });
    });

    test('uses beg without end — falls back to metadata max', () => {
      const r = filterMetadataBySelector(META, { label_asym_id: 'A', beg_label_seq_id: 50 });
      expect(r.residueRanges).toEqual({ A: { min: 50, max: 100 } });
    });
  });

  describe('ligand object selector', () => {
    test('keeps matching ligand and its chain', () => {
      const r = filterMetadataBySelector(META, { label_comp_id: 'HEM' });
      expect(r.ligands).toEqual([{ compId: 'HEM', chainId: 'C' }]);
      expect(r.chains.map(c => c.id)).toEqual(['C']);
    });

    test('returns empty when ligand not in metadata', () => {
      const r = filterMetadataBySelector(META, { label_comp_id: 'ZZZ' });
      expect(r.chains).toHaveLength(0);
      expect(r.ligands).toHaveLength(0);
    });
  });

  describe('entity_type object selector', () => {
    test('keeps only polymer chains', () => {
      const r = filterMetadataBySelector(META, { entity_type: 'polymer' });
      expect(r.chains.map(c => c.id)).toEqual(['A', 'B']);
      expect(r.ligands).toEqual([{ compId: 'ATP', chainId: 'A' }]);
    });

    test('keeps only water chains', () => {
      const r = filterMetadataBySelector(META, { entity_type: 'water' });
      expect(r.chains.map(c => c.id)).toEqual(['W']);
    });
  });

  describe('unknown object selector fields', () => {
    test('returns original metadata unchanged when no known filter field', () => {
      const r = filterMetadataBySelector(META, { auth_asym_id: 'A' } as any);
      expect(r).toBe(META);
    });
  });

  describe('string preset selector', () => {
    test('"all" returns original metadata unchanged', () => {
      expect(filterMetadataBySelector(META, 'all')).toBe(META);
    });

    test('"polymer" keeps only polymer chains with their residueRanges', () => {
      const r = filterMetadataBySelector(META, 'polymer');
      expect(r.chains.map(c => c.id)).toEqual(['A', 'B']);
      expect(Object.keys(r.residueRanges)).toEqual(['A', 'B']);
    });

    test('"water" keeps only water chains', () => {
      const r = filterMetadataBySelector(META, 'water');
      expect(r.chains.map(c => c.id)).toEqual(['W']);
    });

    test('"ligand" keeps all ligands and no chains', () => {
      const r = filterMetadataBySelector(META, 'ligand');
      expect(r.chains).toHaveLength(0);
      expect(r.ligands).toHaveLength(2);
      expect(r.residueRanges).toEqual({});
    });

    test('unknown preset returns original metadata unchanged', () => {
      expect(filterMetadataBySelector(META, 'custom')).toBe(META);
    });
  });

  describe('union selector (array)', () => {
    test('merges results for each entry', () => {
      const r = filterMetadataBySelector(META, [
        { label_asym_id: 'A' },
        { label_asym_id: 'B' },
      ]);
      expect(r.chains.map(c => c.id).sort()).toEqual(['A', 'B']);
    });

    test('union of residueRanges takes bounding box across entries', () => {
      const r = filterMetadataBySelector(META, [
        { label_asym_id: 'A', beg_label_seq_id: 10, end_label_seq_id: 30 },
        { label_asym_id: 'A', beg_label_seq_id: 50, end_label_seq_id: 70 },
      ]);
      expect(r.residueRanges['A']).toEqual({ min: 10, max: 70 });
    });

    test('deduplicates ligands across entries', () => {
      const r = filterMetadataBySelector(META, [
        { label_asym_id: 'A' },
        { label_asym_id: 'A' },
      ]);
      expect(r.ligands).toHaveLength(1);
    });

    test('empty array returns empty metadata', () => {
      const r = filterMetadataBySelector(META, []);
      expect(r.chains).toHaveLength(0);
    });
  });
});
