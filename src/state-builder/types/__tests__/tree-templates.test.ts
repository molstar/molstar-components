import { describe, test, expect } from 'vitest';
import {
  BUILTIN_TEMPLATES,
  getTemplatesForParentKind,
  instantiateTemplate,
  type TreeTemplate,
  type MVSNodeSnippet,
} from '../tree-templates.ts';

describe('Tree Templates', () => {
  describe('BUILTIN_TEMPLATES', () => {
    test('contains expected templates', () => {
      const ids = BUILTIN_TEMPLATES.map((t) => t.id);
      expect(ids).toContain('download-parse-structure');
      expect(ids).toContain('component-repr');
      expect(ids).toContain('component-repr-color');
      expect(ids).toContain('repr-color-label');
      expect(ids).toContain('ligand-ball-stick');
    });

    test('all templates have required fields', () => {
      for (const template of BUILTIN_TEMPLATES) {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.category).toBeTruthy();
        expect(template.validParentKinds.length).toBeGreaterThan(0);
        expect(template.nodes.length).toBeGreaterThan(0);
      }
    });

    test('all templates have valid categories', () => {
      const validCategories = ['structure', 'visualization', 'common', 'custom'];
      for (const template of BUILTIN_TEMPLATES) {
        expect(validCategories).toContain(template.category);
      }
    });
  });

  describe('getTemplatesForParentKind', () => {
    test('returns templates for root parent', () => {
      const templates = getTemplatesForParentKind('root');
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t) => t.id === 'download-parse-structure')).toBe(true);
    });

    test('returns templates for structure parent', () => {
      const templates = getTemplatesForParentKind('structure');
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t) => t.id === 'component-repr')).toBe(true);
      expect(templates.some((t) => t.id === 'ligand-ball-stick')).toBe(true);
    });

    test('returns templates for component parent', () => {
      const templates = getTemplatesForParentKind('component');
      expect(templates.some((t) => t.id === 'repr-color-label')).toBe(true);
    });

    test('returns empty array for kinds with no templates', () => {
      const templates = getTemplatesForParentKind('color');
      expect(templates).toEqual([]);
    });

    test('uses custom templates when provided', () => {
      const customTemplates: TreeTemplate[] = [
        {
          id: 'custom-test',
          name: 'Custom Test',
          description: 'Test',
          category: 'custom',
          validParentKinds: ['download'],
          nodes: [{ kind: 'parse', params: {} }],
        },
      ];
      const templates = getTemplatesForParentKind('download', customTemplates);
      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe('custom-test');
    });

    test('filters correctly with multiple valid parent kinds', () => {
      // repr-color-label is valid for component, component_from_source, component_from_uri
      expect(getTemplatesForParentKind('component').some((t) => t.id === 'repr-color-label')).toBe(true);
      expect(getTemplatesForParentKind('component_from_source').some((t) => t.id === 'repr-color-label')).toBe(true);
      expect(getTemplatesForParentKind('component_from_uri').some((t) => t.id === 'repr-color-label')).toBe(true);
    });
  });

  describe('instantiateTemplate', () => {
    test('creates UINodes with unique IDs', () => {
      const template = BUILTIN_TEMPLATES.find((t) => t.id === 'component-repr')!;
      const nodes1 = instantiateTemplate(template);
      const nodes2 = instantiateTemplate(template);

      expect(nodes1[0].id).not.toBe(nodes2[0].id);
    });

    test('preserves node structure', () => {
      const template = BUILTIN_TEMPLATES.find((t) => t.id === 'component-repr')!;
      const nodes = instantiateTemplate(template);

      expect(nodes).toHaveLength(1);
      expect(nodes[0].kind).toBe('component');
      expect(nodes[0].params).toEqual({ selector: 'all' });
      expect(nodes[0].children).toHaveLength(1);
      expect(nodes[0].children![0].kind).toBe('representation');
    });

    test('handles deeply nested structures', () => {
      const template = BUILTIN_TEMPLATES.find((t) => t.id === 'download-parse-structure')!;
      const nodes = instantiateTemplate(template);

      // download → parse → structure
      expect(nodes[0].kind).toBe('download');
      expect(nodes[0].children![0].kind).toBe('parse');
      expect(nodes[0].children![0].children![0].kind).toBe('structure');

      // All have unique IDs
      const allIds = new Set<string>();
      interface IdNode { id: string; children?: IdNode[] }
      function collectIds(node: IdNode) {
        allIds.add(node.id);
        node.children?.forEach(collectIds);
      }
      nodes.forEach(collectIds);
      expect(allIds.size).toBe(3);
    });

    test('handles templates with multiple root nodes', () => {
      const template = BUILTIN_TEMPLATES.find((t) => t.id === 'repr-color-label')!;
      const nodes = instantiateTemplate(template);

      // Should have 2 root nodes: representation and label
      expect(nodes).toHaveLength(2);
      expect(nodes[0].kind).toBe('representation');
      expect(nodes[1].kind).toBe('label');
    });

    test('preserves ref if present in snippet', () => {
      const templateWithRef: TreeTemplate = {
        id: 'test-ref',
        name: 'Test Ref',
        description: 'Test',
        category: 'custom',
        validParentKinds: ['root'],
        nodes: [{ kind: 'download', params: {}, ref: 'myDownload' }],
      };
      const nodes = instantiateTemplate(templateWithRef);
      expect(nodes[0].ref).toBe('myDownload');
    });

    test('preserves custom if present in snippet', () => {
      const templateWithCustom: TreeTemplate = {
        id: 'test-custom',
        name: 'Test Custom',
        description: 'Test',
        category: 'custom',
        validParentKinds: ['root'],
        nodes: [{ kind: 'color', params: {}, custom: { colorTheme: 'chain-id' } }],
      };
      const nodes = instantiateTemplate(templateWithCustom);
      expect(nodes[0].custom).toEqual({ colorTheme: 'chain-id' });
    });

    test('does not modify original template', () => {
      const template = BUILTIN_TEMPLATES.find((t) => t.id === 'component-repr')!;
      const originalParams = { ...template.nodes[0].params };

      const nodes = instantiateTemplate(template);
      nodes[0].params.selector = 'polymer';

      expect(template.nodes[0].params).toEqual(originalParams);
    });
  });
});
