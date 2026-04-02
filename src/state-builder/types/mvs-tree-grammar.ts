/**
 * MVS Tree Grammar - Valid Parent-Child Relationships
 *
 * This module dynamically derives the valid parent-child relationships
 * from Molstar's MVSTreeSchema. The schema defines which parents each
 * node type can have, and we invert that to get valid children.
 *
 * This ensures we stay in sync with the official MVS specification.
 */

import { MVSTreeSchema } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';

/**
 * Human-readable display labels for each MVS node kind.
 * Derived from the MVSTreeSchema to stay in sync.
 */
export const MVS_KIND_LABELS: Record<MVSKind, string> = Object.fromEntries(
  Object.keys(MVSTreeSchema.nodes).map((kind) => [
    kind,
    kind
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  ])
) as Record<MVSKind, string>;

/**
 * All MVS node kinds (derived from schema).
 */
export const MVS_ALL_KINDS: readonly MVSKind[] = Object.keys(
  MVSTreeSchema.nodes
) as MVSKind[];

/**
 * All selectable node kinds (excludes 'root' which is implicit).
 */
export const MVS_SELECTABLE_KINDS: readonly MVSKind[] = MVS_ALL_KINDS.filter(
  (k) => k !== 'root'
);

/**
 * Compute valid children for each node kind by inverting the parent relationships
 * defined in MVSTreeSchema.
 *
 * If node X has parent [Y, Z], then Y and Z can have X as a child.
 */
function computeValidChildren(): Record<MVSKind, readonly MVSKind[]> {
  const validChildren: Record<string, string[]> = {};

  // Initialize empty arrays for all node kinds
  for (const kind of Object.keys(MVSTreeSchema.nodes)) {
    validChildren[kind] = [];
  }

  // Invert: if node X has parent Y, then Y can have child X
  for (const [kind, nodeDef] of Object.entries(MVSTreeSchema.nodes)) {
    const nodeDefinition = nodeDef as { parent: string[] };
    for (const parentKind of nodeDefinition.parent) {
      if (validChildren[parentKind]) {
        validChildren[parentKind].push(kind);
      }
    }
  }

  // Sort children alphabetically for consistent ordering
  for (const kind of Object.keys(validChildren)) {
    validChildren[kind].sort();
  }

  return validChildren as Record<MVSKind, readonly MVSKind[]>;
}

/**
 * Map of valid children for each MVS node kind.
 * Computed once at module load from Molstar's MVSTreeSchema.
 *
 * @example
 * ```ts
 * MVS_VALID_CHILDREN['root']
 * // => ['camera', 'canvas', 'download', 'focus', 'primitives', 'primitives_from_uri']
 *
 * MVS_VALID_CHILDREN['structure']
 * // => ['component', 'component_from_source', 'component_from_uri', ...]
 * ```
 */
export const MVS_VALID_CHILDREN: Record<MVSKind, readonly MVSKind[]> =
  computeValidChildren();

/**
 * Get valid children for a specific node kind.
 *
 * @param kind - The parent node kind
 * @returns Array of valid child node kinds, or empty array if none
 */
export function getValidChildren(kind: MVSKind | ''): readonly MVSKind[] {
  if (!kind) return [];
  return MVS_VALID_CHILDREN[kind] ?? [];
}

/**
 * Check if a child kind is valid for a given parent kind.
 *
 * @param parentKind - The parent node kind
 * @param childKind - The potential child node kind
 * @returns true if the child is valid for the parent
 */
export function canHaveChild(
  parentKind: MVSKind | '',
  childKind: MVSKind | ''
): boolean {
  if (!parentKind || !childKind) return false;
  const validChildren = MVS_VALID_CHILDREN[parentKind];
  return validChildren?.includes(childKind) ?? false;
}

/**
 * Get all node kinds that have no valid children (leaf nodes).
 *
 * @returns Array of terminal node kinds
 */
export function getTerminalKinds(): readonly MVSKind[] {
  return (Object.entries(MVS_VALID_CHILDREN) as [MVSKind, readonly MVSKind[]][])
    .filter(([_, children]) => children.length === 0)
    .map(([kind]) => kind);
}

/**
 * Check if a node kind is a terminal (leaf) node.
 *
 * @param kind - The node kind to check
 * @returns true if the node cannot have children
 */
export function isTerminalKind(kind: MVSKind | ''): boolean {
  if (!kind) return true;
  const validChildren = MVS_VALID_CHILDREN[kind];
  return !validChildren || validChildren.length === 0;
}
