/**
 * Template Registry - Central Template Management
 *
 * The registry aggregates templates from multiple adapters and provides
 * filtering by parent kind. It includes the built-in adapter by default.
 */

import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import type { TreeTemplate } from './tree-templates.ts';
import { BUILTIN_TEMPLATES, getTemplatesForParentKind } from './tree-templates.ts';
import type { TemplateAdapter } from './adapter.ts';
import { BUILTIN_ADAPTER_ID } from './adapter.ts';

/**
 * Registry for managing template adapters and querying templates.
 */
export interface TemplateRegistry {
  /**
   * Register a template adapter.
   * @param adapter - The adapter to register
   * @throws If an adapter with the same ID is already registered
   */
  registerAdapter(adapter: TemplateAdapter): void;

  /**
   * Unregister a template adapter.
   * @param adapterId - The ID of the adapter to remove
   */
  unregisterAdapter(adapterId: string): void;

  /**
   * Get all templates from all registered adapters.
   * @returns Promise resolving to all available templates
   */
  getAllTemplates(): Promise<TreeTemplate[]>;

  /**
   * Get templates valid for a specific parent kind.
   * @param parentKind - The kind of the parent node
   * @returns Promise resolving to filtered templates
   */
  getTemplatesForParentKind(parentKind: MVSKind): Promise<TreeTemplate[]>;
}

/**
 * Built-in adapter that provides hardcoded templates.
 */
const builtinAdapter: TemplateAdapter = {
  id: BUILTIN_ADAPTER_ID,
  name: 'Built-in Templates',
  listTemplates: async () => [...BUILTIN_TEMPLATES],
};

/**
 * Create a new template registry with the built-in adapter pre-registered.
 *
 * @returns A new TemplateRegistry instance
 *
 * @example
 * ```ts
 * const registry = createTemplateRegistry();
 *
 * // Get all templates
 * const all = await registry.getAllTemplates();
 *
 * // Get templates valid for 'structure' parent
 * const structureTemplates = await registry.getTemplatesForParentKind('structure');
 *
 * // Register a custom adapter
 * registry.registerAdapter({
 *   id: 'custom',
 *   name: 'My Templates',
 *   listTemplates: async () => myTemplates,
 * });
 * ```
 */
export function createTemplateRegistry(): TemplateRegistry {
  const adapters = new Map<string, TemplateAdapter>();

  // Pre-register built-in adapter
  adapters.set(BUILTIN_ADAPTER_ID, builtinAdapter);

  return {
    registerAdapter(adapter: TemplateAdapter): void {
      if (adapters.has(adapter.id)) {
        throw new Error(`Template adapter with ID "${adapter.id}" is already registered`);
      }
      adapters.set(adapter.id, adapter);
    },

    unregisterAdapter(adapterId: string): void {
      adapters.delete(adapterId);
    },

    async getAllTemplates(): Promise<TreeTemplate[]> {
      const results = await Promise.all(
        Array.from(adapters.values()).map((adapter) => adapter.listTemplates())
      );
      return results.flat();
    },

    async getTemplatesForParentKind(parentKind: MVSKind): Promise<TreeTemplate[]> {
      const all = await this.getAllTemplates();
      return getTemplatesForParentKind(parentKind, all);
    },
  };
}
