// src/state-builder-ui/node-categories.ts
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';

export type NodeCategory =
  | 'data'
  | 'structure'
  | 'component'
  | 'visual'
  | 'annotation'
  | 'view'
  | 'animation';

interface CategoryDef {
  color: string;
  kinds: string[];
}

export const NODE_CATEGORIES: Record<NodeCategory, CategoryDef> = {
  data: {
    color: '#3b82f6',
    kinds: ['download', 'parse', 'coordinates'],
  },
  structure: {
    color: '#8b5cf6',
    kinds: ['structure', 'transform', 'instance', 'volume'],
  },
  component: {
    color: '#f59e0b',
    kinds: ['component', 'component_from_uri', 'component_from_source'],
  },
  visual: {
    color: '#10b981',
    kinds: [
      'representation',
      'color',
      'opacity',
      'clip',
      'volume_representation',
      'color_from_uri',
      'color_from_source',
    ],
  },
  annotation: {
    color: '#f43f5e',
    kinds: [
      'label',
      'label_from_uri',
      'label_from_source',
      'tooltip',
      'tooltip_from_uri',
      'tooltip_from_source',
      'primitives',
      'primitives_from_uri',
      'primitive',
    ],
  },
  view: {
    color: '#06b6d4',
    kinds: ['camera', 'focus', 'canvas'],
  },
  animation: {
    color: '#ec4899',
    kinds: ['animation', 'interpolate'],
  },
};

// Build reverse lookup once
const _kindToCategory = new Map<string, NodeCategory>();
for (const [cat, def] of Object.entries(NODE_CATEGORIES) as [NodeCategory, CategoryDef][]) {
  for (const kind of def.kinds) {
    _kindToCategory.set(kind, cat);
  }
}

export function getCategoryForKind(kind: MVSKind | ''): NodeCategory | null {
  return _kindToCategory.get(kind) ?? null;
}

export function getColorForKind(kind: MVSKind | ''): string {
  const cat = getCategoryForKind(kind);
  return cat ? NODE_CATEGORIES[cat].color : '#94a3b8';
}

/**
 * Node kinds with no implemented editing helper — OperationRow's kind→Helper
 * switch falls through to `default: return null` for these, so clicking such
 * a node currently opens nothing. Hidden from kind pickers ("Add child" menus,
 * empty-node kind selection) until helpers exist.
 * See context/plans/2026-08-09-unimplemented-node-helpers.md.
 */
export const UNIMPLEMENTED_HELPER_KINDS: readonly MVSKind[] = ['coordinates', 'instance', 'primitives_from_uri'];

export function withImplementedHelpersOnly<T extends readonly MVSKind[]>(kinds: T): MVSKind[] {
  return kinds.filter((k) => !UNIMPLEMENTED_HELPER_KINDS.includes(k));
}
