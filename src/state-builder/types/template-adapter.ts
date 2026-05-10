/**
 * Template Adapter - Extensible Template Source Interface
 *
 * Adapters allow templates to be loaded from different sources:
 * - Built-in templates (hardcoded)
 * - File system (user templates)
 * - Remote APIs (shared templates)
 */

import type { TreeTemplate } from './tree-templates.ts';

/**
 * ID for the built-in template adapter
 */
export const BUILTIN_ADAPTER_ID = 'builtin';

/**
 * Interface for template source adapters.
 * Implement this to add custom template sources.
 */
export interface TemplateAdapter {
  /** Unique identifier for this adapter */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /**
   * List all templates available from this source.
   * Returns a promise to support async sources (file system, network).
   */
  listTemplates(): Promise<TreeTemplate[]>;
}
