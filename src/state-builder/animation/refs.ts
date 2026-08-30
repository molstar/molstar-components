import type { UINode } from '../core/index.ts';
import type { RefInfo, InterpolationKind } from './types.ts';
import { VALID_REF_KINDS } from './constants.ts';

/** Recursively extract all ref values (with node kind) from a UINode tree */
export function extractRefsFromNodes(nodes: UINode[]): RefInfo[] {
  const refs: RefInfo[] = [];

  function traverse(node: UINode) {
    if (node.ref) refs.push({ ref: node.ref, kind: node.kind });
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return refs;
}

/** Filter refs to only those whose node kind is valid for the given interpolation kind */
export function filterRefsForKind(refs: RefInfo[], kind: InterpolationKind): RefInfo[] {
  const validKinds = VALID_REF_KINDS[kind];
  if (!validKinds) return refs;
  return refs.filter((r) => validKinds.includes(r.kind));
}
