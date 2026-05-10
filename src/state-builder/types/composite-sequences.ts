/**
 * Composite Sequences - View-Level Abstraction for MVS Node Patterns
 *
 * The UI rendering layer detects known node sequences and renders them as single
 * composite rows. The underlying state remains regular MVS nodes - no new node types,
 * no changes to AST/factory/codegen.
 */

import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import type { UINode } from './ui-builder.ts';
import { createEmptyNode, getValidChildren } from './index-internal.ts';

export interface CompositeSequence {
  id: string;
  label: string;
  /** Value used in select dropdowns to identify this composite */
  selectValue: string;
  /** Pattern to match: array of kinds in parent→child order */
  pattern: readonly MVSKind[];
  /** The kind of the last node in pattern (determines valid children) */
  exitKind: MVSKind;
}

export const DOWNLOAD_PARSE_SEQUENCE: CompositeSequence = {
  id: 'download-parse',
  label: 'Download + Parse',
  selectValue: '__composite:download-parse',
  pattern: ['download', 'parse'],
  exitKind: 'parse',
};

export const COMPOSITE_SEQUENCES: readonly CompositeSequence[] = [
  DOWNLOAD_PARSE_SEQUENCE,
];

/**
 * Detect if a node is the root of a composite sequence.
 * Returns the sequence and the exit node if matched.
 */
export function detectCompositeSequence(node: UINode): {
  sequence: CompositeSequence;
  exitNode: UINode;
} | null {
  // Check for download → parse pattern
  if (node.kind === 'download') {
    const parseChild = node.children?.[0];
    if (parseChild?.kind === 'parse') {
      return {
        sequence: DOWNLOAD_PARSE_SEQUENCE,
        exitNode: parseChild,
      };
    }
  }
  return null;
}

/**
 * Create a new composite node structure for download + parse.
 */
export function createDownloadParseNodes(): UINode {
  const parseNode = createEmptyNode('parse');
  parseNode.params = { format: 'bcif' };

  const downloadNode = createEmptyNode('download');
  downloadNode.params = { url: '' };
  downloadNode.children = [parseNode];

  return downloadNode;
}

/**
 * Get valid children for a composite's exit node.
 */
export function getCompositeValidChildren(sequence: CompositeSequence): readonly MVSKind[] {
  return getValidChildren(sequence.exitKind);
}
