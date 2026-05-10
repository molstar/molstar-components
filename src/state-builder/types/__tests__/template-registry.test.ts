import { describe, test, expect } from 'vitest';
import { createTemplateRegistry, type TemplateRegistry } from '../template-registry.ts';
import { BUILTIN_ADAPTER_ID, type TemplateAdapter } from '../template-adapter.ts';
import type { TreeTemplate } from '../tree-templates.ts';

describe('Template Registry', () => {
  describe('createTemplateRegistry', () => {
    test('creates registry with builtin adapter pre-registered', async () => {
      const registry = createTemplateRegistry();
      const templates = await registry.getAllTemplates();

      // Should have builtin templates
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t) => t.id === 'download-parse-structure')).toBe(true);
    });
  });

  describe('registerAdapter', () => {
    test('adds adapter templates to registry', async () => {
      const registry = createTemplateRegistry();
      const customAdapter: TemplateAdapter = {
        id: 'custom',
        name: 'Custom Templates',
        listTemplates: async () => [
          {
            id: 'custom-template',
            name: 'Custom Template',
            description: 'A custom template',
            category: 'custom',
            validParentKinds: ['root'],
            nodes: [{ kind: 'download', params: {} }],
          },
        ],
      };

      registry.registerAdapter(customAdapter);
      const templates = await registry.getAllTemplates();

      expect(templates.some((t) => t.id === 'custom-template')).toBe(true);
    });

    test('throws when registering duplicate adapter ID', () => {
      const registry = createTemplateRegistry();
      const adapter: TemplateAdapter = {
        id: BUILTIN_ADAPTER_ID,
        name: 'Duplicate',
        listTemplates: async () => [],
      };

      expect(() => registry.registerAdapter(adapter)).toThrow(
        `Template adapter with ID "${BUILTIN_ADAPTER_ID}" is already registered`
      );
    });

    test('allows multiple custom adapters', async () => {
      const registry = createTemplateRegistry();

      registry.registerAdapter({
        id: 'adapter1',
        name: 'Adapter 1',
        listTemplates: async () => [
          { id: 'template1', name: 'T1', description: '', category: 'custom', validParentKinds: ['root'], nodes: [] },
        ],
      });

      registry.registerAdapter({
        id: 'adapter2',
        name: 'Adapter 2',
        listTemplates: async () => [
          { id: 'template2', name: 'T2', description: '', category: 'custom', validParentKinds: ['root'], nodes: [] },
        ],
      });

      const templates = await registry.getAllTemplates();
      expect(templates.some((t) => t.id === 'template1')).toBe(true);
      expect(templates.some((t) => t.id === 'template2')).toBe(true);
    });
  });

  describe('unregisterAdapter', () => {
    test('removes adapter templates from registry', async () => {
      const registry = createTemplateRegistry();

      registry.registerAdapter({
        id: 'removable',
        name: 'Removable',
        listTemplates: async () => [
          { id: 'removable-template', name: 'RT', description: '', category: 'custom', validParentKinds: ['root'], nodes: [] },
        ],
      });

      // Verify it was added
      let templates = await registry.getAllTemplates();
      expect(templates.some((t) => t.id === 'removable-template')).toBe(true);

      // Remove it
      registry.unregisterAdapter('removable');

      // Verify it was removed
      templates = await registry.getAllTemplates();
      expect(templates.some((t) => t.id === 'removable-template')).toBe(false);
    });

    test('can unregister builtin adapter', async () => {
      const registry = createTemplateRegistry();

      registry.unregisterAdapter(BUILTIN_ADAPTER_ID);
      const templates = await registry.getAllTemplates();

      expect(templates).toEqual([]);
    });

    test('does nothing for non-existent adapter', () => {
      const registry = createTemplateRegistry();

      // Should not throw
      expect(() => registry.unregisterAdapter('non-existent')).not.toThrow();
    });
  });

  describe('getAllTemplates', () => {
    test('aggregates templates from all adapters', async () => {
      const registry = createTemplateRegistry();

      registry.registerAdapter({
        id: 'custom1',
        name: 'Custom 1',
        listTemplates: async () => [
          { id: 'c1', name: 'C1', description: '', category: 'custom', validParentKinds: ['root'], nodes: [] },
        ],
      });

      registry.registerAdapter({
        id: 'custom2',
        name: 'Custom 2',
        listTemplates: async () => [
          { id: 'c2', name: 'C2', description: '', category: 'custom', validParentKinds: ['structure'], nodes: [] },
        ],
      });

      const templates = await registry.getAllTemplates();

      // Should have builtin + custom1 + custom2
      expect(templates.some((t) => t.id === 'download-parse-structure')).toBe(true); // builtin
      expect(templates.some((t) => t.id === 'c1')).toBe(true);
      expect(templates.some((t) => t.id === 'c2')).toBe(true);
    });

    test('handles async adapter failures gracefully', async () => {
      const registry = createTemplateRegistry();

      registry.registerAdapter({
        id: 'failing',
        name: 'Failing',
        listTemplates: async () => {
          throw new Error('Network error');
        },
      });

      // Should reject with the error
      await expect(registry.getAllTemplates()).rejects.toThrow('Network error');
    });
  });

  describe('getTemplatesForParentKind', () => {
    test('filters templates by parent kind', async () => {
      const registry = createTemplateRegistry();
      const templates = await registry.getTemplatesForParentKind('structure');

      expect(templates.length).toBeGreaterThan(0);
      for (const template of templates) {
        expect(template.validParentKinds).toContain('structure');
      }
    });

    test('returns empty array for kinds with no matching templates', async () => {
      const registry = createTemplateRegistry();
      const templates = await registry.getTemplatesForParentKind('color');

      expect(templates).toEqual([]);
    });

    test('includes templates from custom adapters', async () => {
      const registry = createTemplateRegistry();

      registry.registerAdapter({
        id: 'custom',
        name: 'Custom',
        listTemplates: async () => [
          {
            id: 'custom-structure-template',
            name: 'Custom',
            description: '',
            category: 'custom',
            validParentKinds: ['structure'],
            nodes: [],
          },
        ],
      });

      const templates = await registry.getTemplatesForParentKind('structure');
      expect(templates.some((t) => t.id === 'custom-structure-template')).toBe(true);
    });
  });
});
