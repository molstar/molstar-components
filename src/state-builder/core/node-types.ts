// Core UI-node type definitions
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import type { ConstantDefinition } from './constants.ts';

/**
 * Mutable MVS node for UI editing
 * This matches the MVS JSON structure but allows mutation for React state
 */
export interface UINode {
  /** Unique ID for React keys (not part of MVS spec) */
  id: string;

  /** MVS node kind */
  kind: MVSKind | '';

  /** Type-safe parameters for this kind */
  params: Record<string, unknown>;

  /** Optional reference name */
  ref?: string;

  /** Custom properties (Molstar-specific extensions like color themes) */
  custom?: Record<string, unknown>;

  /** Child nodes */
  children?: UINode[];
}

/**
 * Complete UI Builder state
 */
export interface UIBuilderState {
  /** Root-level nodes */
  nodes: UINode[];

  /** Constant definitions */
  constants?: ConstantDefinition[];

  /** Metadata */
  metadata?: {
    timestamp?: string;
  };
}
