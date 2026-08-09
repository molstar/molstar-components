// UINode <-> raw MVS JSON conversion
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import type { UINode } from './node-types.ts';
import { generateId } from './constants.ts';

/**
 * Raw MVS JSON node structure (more permissive than strict MVSNode union)
 */
export interface RawMVSNode {
  kind: string;
  params?: Record<string, unknown>;
  ref?: string;
  custom?: Record<string, unknown>;
  children?: RawMVSNode[];
}

/**
 * MVS Tree root structure
 */
export interface RawMVSTree {
  kind: 'root';
  params?: Record<string, unknown>;
  children?: RawMVSNode[];
}

/**
 * Convert a raw MVS JSON node to UINode by adding IDs recursively.
 *
 * @param node - Raw MVS node from JSON
 * @param idPrefix - Optional prefix for generating unique IDs
 * @returns UINode with generated ID
 */
export function mvsNodeToUINode(node: RawMVSNode, idPrefix = ''): UINode {
  const id = `${idPrefix}${generateId()}`;
  return {
    id,
    kind: node.kind as MVSKind | '',
    params: node.params ?? {},
    ref: node.ref,
    custom: node.custom,
    children: node.children?.map((child, i) => mvsNodeToUINode(child, `${id}_${i}_`)),
  };
}

/**
 * Convert an MVS Tree (root node) to UINode array.
 * Extracts the children of the root and converts them to UINodes.
 *
 * @param tree - MVS Tree with kind 'root'
 * @returns Array of UINodes (root's children with IDs)
 */
export function mvsTreeToUINodes(tree: RawMVSTree): UINode[] {
  if (!tree.children) return [];
  return tree.children.map((node, i) => mvsNodeToUINode(node, `${i}_`));
}

/**
 * Split a `primitives` UINode into multiple nodes grouped by the `label_attachment`
 * value stored on individual `primitive` children (a UI-only extension).
 * Primitives without a per-child attachment inherit the container's value.
 * Used so a single UINode can produce multiple `.primitives()` calls in codegen.
 */
function expandPrimitivesInChildren(children: UINode[]): UINode[] {
  return children.flatMap((child) => {
    if (child.kind !== 'primitives') return [child];

    const primitiveChildren = child.children ?? [];
    const hasPerChildAttachment = primitiveChildren.some(
      (c) => c.params.label_attachment !== undefined
    );
    if (!hasPerChildAttachment) return [child];

    const containerAttachment = child.params.label_attachment as string | undefined;
    const groups = new Map<string, UINode[]>();

    for (const prim of primitiveChildren) {
      const key =
        (prim.params.label_attachment as string | undefined) ??
        containerAttachment ??
        '';
      if (!groups.has(key)) groups.set(key, []);
      const { label_attachment: _la, ...restParams } = prim.params;
      groups.get(key)!.push({ ...prim, params: restParams });
    }

    const { label_attachment: _la, ...containerRest } = child.params;
    return [...groups.entries()].map(([key, groupChildren], index) => ({
      ...child,
      // Sub-index ref so each split node gets a unique variable name in codegen.
      ref: child.ref ? `${child.ref}_${index}` : child.ref,
      params: key ? { ...containerRest, label_attachment: key } : containerRest,
      children: groupChildren,
    }));
  });
}

/**
 * Convert UINode back to raw MVS node by stripping IDs recursively.
 *
 * @param node - UINode to convert
 * @returns Raw MVS node without ID
 */
export function uiNodeToMVSNode(node: UINode): RawMVSNode {
  const result: RawMVSNode = {
    kind: node.kind,
    params: node.params,
  };

  if (node.ref) {
    result.ref = node.ref;
  }

  if (node.custom) {
    result.custom = node.custom;
  }

  if (node.children && node.children.length > 0) {
    result.children = expandPrimitivesInChildren(node.children).map(uiNodeToMVSNode);
  }

  return result;
}

/**
 * Convert UINode array to MVS Tree structure.
 *
 * @param nodes - Array of UINodes
 * @returns MVS Tree with root wrapper
 */
export function uiNodesToMVSTree(nodes: UINode[]): RawMVSTree {
  return {
    kind: 'root',
    params: {},
    children: nodes.map(uiNodeToMVSNode),
  };
}
