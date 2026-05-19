import { MVSKind, MVSSubtree } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import { MVSNode } from './node.ts';
import type { AST, CustomProps, NodeParams } from './types.ts';
import { ASTError } from './types.ts';
import { VALID_MVS_KINDS } from '../constants.ts';
import { canHaveChild } from '../../types/mvs-tree-grammar.ts';


function isValidNodeStructure(value: unknown): value is {
  kind: string;
  params?: Record<string, unknown>;
  children?: unknown[];
  ref?: string;
  custom?: Record<string, unknown>;
} {
  if (!value || typeof value !== 'object') return false;

  const node = value as Record<string, unknown>;

  if (typeof node.kind !== 'string') return false;

  if (node.params !== undefined &&
      (typeof node.params !== 'object' || node.params === null)) {
    return false;
  }

  if (node.children !== undefined && !Array.isArray(node.children)) {
    return false;
  }

  if (node.ref !== undefined && typeof node.ref !== 'string') {
    return false;
  }

  if (node.custom !== undefined &&
      (typeof node.custom !== 'object' || node.custom === null)) {
    return false;
  }

  return true;
}

function isValidMVSKind(kind: string): kind is MVSKind {
  return VALID_MVS_KINDS.includes(kind as MVSKind);
}

// Converts MVS JSON to AST
export class ASTFactory {

  static fromMVSData(data: unknown): AST {
    if (!data || typeof data !== 'object') {
      throw new ASTError('Invalid MVSData: must be an object');
    }

    const mvsData = data as Record<string, unknown>;

    if (mvsData.kind === 'multiple') {
      throw new ASTError('Multi-state MVS not yet supported');
    }

    if (!mvsData.root) {
      throw new ASTError('Invalid MVSData: missing root node');
    }

    const root = this.fromSubtree(mvsData.root, ['root']);

    if (!root.is('root')) {
      throw new ASTError('Root node must have kind "root"');
    }

    const metadata = this.extractMetadata(mvsData.metadata);

    return {
      root,
      metadata,
    };
  }

  private static extractMetadata(metadata: unknown): AST['metadata'] {
    if (!metadata || typeof metadata !== 'object') {
      // Return default metadata
      return {
        timestamp: new Date().toISOString(),
      };
    }

    const meta = metadata as Record<string, unknown>;

    return {
      timestamp: typeof meta.timestamp === 'string'
        ? meta.timestamp
        : new Date().toISOString(),
    };
  }

  private static fromSubtree(
    node: unknown,
    path: string[] = []
  ): MVSNode {
    try {
      if (!isValidNodeStructure(node)) {
        throw new ASTError('Invalid node structure', node, path);
      }

      const { kind, params = {}, children = [], ref, custom } = node;

      if (!isValidMVSKind(kind)) {
        throw new ASTError(`Unknown node kind: ${kind}`, node, path);
      }

      // Validate parent-child relationships before recursing
      for (const child of children) {
        // TODO: animation is a separate MVSAnimationSchema tree in the real molstar API (a sibling to the
        // scene tree, not a child of root). The compiler currently treats it as a child of root as a
        // workaround — skip schema grammar validation for it until that is properly restructured.
        if (isValidNodeStructure(child) && isValidMVSKind(child.kind) && child.kind !== 'animation' && !canHaveChild(kind, child.kind)) {
          throw new ASTError(
            `Invalid parent-child relationship: "${child.kind}" cannot be a child of "${kind}"`,
            node,
            path,
          );
        }
      }

      // Recursively convert children
      const childNodes = children.map((child, index) =>
        this.fromSubtree(child, [...path, kind, `children[${index}]`])
      );

      // Create AST node with proper typing
      return new MVSNode(
        kind,
        params as NodeParams<typeof kind>,
        childNodes,
        ref,
        custom as CustomProps
      );
    } catch (error) {
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(
        `Failed to convert node: ${error instanceof Error ? error.message : String(error)}`,
        node,
        path
      );
    }
  }

  static fromJSON(jsonString: string): AST {
    try {
      const data: unknown = JSON.parse(jsonString);
      return this.fromMVSData(data);
    } catch (error) {
      if (error instanceof ASTError) {
        throw error;
      }
      throw new ASTError(
        `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}