// Node creation/copy/count helpers
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import type { UINode } from './node-types.ts';
import { generateId } from './constants.ts';

/**
 * Helper for creating empty nodes
 */
export function createEmptyNode(kind: MVSKind | '' = ''): UINode {
  return {
    id: generateId(),
    kind,
    params: {},
    children: [],
  };
}

/**
 * Deep-copy a UINode subtree: fresh IDs throughout, refs suffixed with `_copy`.
 */
export function deepCopyNode(node: UINode): UINode {
  return {
    ...node,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ref: node.ref ? `${node.ref}_copy` : undefined,
    children: node.children?.map(deepCopyNode),
  };
}

/**
 * Count total nodes in a subtree (excluding the root node itself)
 */
export function countSubtreeNodes(node: UINode): number {
  if (!node.children || node.children.length === 0) return 0;
  return node.children.reduce(
    (sum, child) => sum + 1 + countSubtreeNodes(child),
    0
  );
}
