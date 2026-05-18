import { describe, test, expect } from 'vitest';
import { ASTFactory } from '../../ast/factory.ts';
import { CodeGenerator } from '../../codegen/generator.ts';

describe('CodeGenerator', () => {
  describe('Basic Generation', () => {
    test('generates empty code for empty root', () => {
      const json = {
        root: {
          kind: 'root',
          children: [],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator();
      const code = generator.generate(ast);

      expect(code).toContain('// Start of generated section');
      expect(code).toContain('// End of generated section');
    });

    test('generates code for download → parse', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'https://example.com/test.cif' },
              children: [
                {
                  kind: 'parse',
                  params: { format: 'mmcif' },
                  children: [],
                },
              ],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain("const download_0 = builder.download({ url: 'https://example.com/test.cif' });");
      expect(code).toContain("const parse_0 = download_0.parse({ format: 'mmcif' });");
    });

    test('generates code for complete structure', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              children: [
                {
                  kind: 'parse',
                  params: { format: 'mmcif' },
                  children: [
                    {
                      kind: 'structure',
                      params: { type: 'model' },
                      children: [
                        {
                          kind: 'component',
                          params: { selector: 'polymer' },
                          children: [
                            {
                              kind: 'representation',
                              params: { type: 'cartoon' },
                              children: [
                                {
                                  kind: 'color',
                                  params: { color: '#FF0000' },
                                  children: [],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain("const download_0 = builder.download({ url: 'test.cif' });");
      expect(code).toContain("const parse_0 = download_0.parse({ format: 'mmcif' });");
      expect(code).toContain('const structure_0 = parse_0.modelStructure({});');
      expect(code).toContain("const component_0 = structure_0.component({ selector: 'polymer' });");
      expect(code).toContain("const representation_0 = component_0.representation({ type: 'cartoon' });");
      expect(code).toContain("representation_0.color({ color: '#FF0000' });");
    });
  });

  describe('Chainable Nodes', () => {
    test('generates chaining code for canvas and camera', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'canvas',
              params: { background_color: '#FFFFFF' },
              children: [],
            },
            {
              kind: 'camera',
              params: {
                target: [0, 0, 0],
                position: [10, 10, 10],
              },
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain("builder.canvas({ background_color: '#FFFFFF' });");
      expect(code).toContain('builder.camera({ target: [0, 0, 0], position: [10, 10, 10] });');
    });

    test('chains transform and focus', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              children: [
                {
                  kind: 'parse',
                  params: { format: 'mmcif' },
                  children: [
                    {
                      kind: 'structure',
                      params: { type: 'model' },
                      children: [
                        {
                          kind: 'transform',
                          params: {
                            rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1],
                            translation: [10, 20, 30],
                          },
                          children: [],
                        },
                        {
                          kind: 'component',
                          params: { selector: 'all' },
                          children: [
                            {
                              kind: 'focus',
                              params: {},
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain('structure_0.transform(');
      expect(code).toContain('rotation: [1, 0, 0, 0, 1, 0, 0, 0, 1]');
      expect(code).toContain('translation: [10, 20, 30]');
      expect(code).toContain('component_0.focus({});');
    });
  });

  describe('Reference Handling', () => {
    test('uses ref as variable name', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              ref: 'mainStructure',
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain("const mainStructure = builder.download({ url: 'test.cif', ref: 'mainStructure' });");
    });

    test('handles multiple refs', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'first.cif' },
              ref: 'struct1',
              children: [],
            },
            {
              kind: 'download',
              params: { url: 'second.cif' },
              ref: 'struct2',
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain("const struct1 = builder.download({ url: 'first.cif', ref: 'struct1' });");
      expect(code).toContain("const struct2 = builder.download({ url: 'second.cif', ref: 'struct2' });");
    });
  });

  describe('Structure Variants', () => {
    test('generates modelStructure', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              children: [
                {
                  kind: 'parse',
                  params: { format: 'mmcif' },
                  children: [
                    {
                      kind: 'structure',
                      params: { type: 'model', model_index: 0 },
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain('parse_0.modelStructure({ model_index: 0 });');
    });

    test('generates assemblyStructure', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              children: [
                {
                  kind: 'parse',
                  params: { format: 'mmcif' },
                  children: [
                    {
                      kind: 'structure',
                      params: { type: 'assembly', assembly_id: '1' },
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain("parse_0.assemblyStructure({ assembly_id: '1' });");
    });

    test('generates symmetryStructure', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              children: [
                {
                  kind: 'parse',
                  params: { format: 'mmcif' },
                  children: [
                    {
                      kind: 'structure',
                      params: {
                        type: 'symmetry',
                        ijk_min: [-1, -1, -1],
                        ijk_max: [1, 1, 1],
                      },
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain('parse_0.symmetryStructure({ ijk_min: [-1, -1, -1], ijk_max: [1, 1, 1] });');
    });
  });

  describe('Component Variants', () => {
    test('generates component', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              children: [
                {
                  kind: 'parse',
                  params: { format: 'mmcif' },
                  children: [
                    {
                      kind: 'structure',
                      params: { type: 'model' },
                      children: [
                        {
                          kind: 'component',
                          params: { selector: 'polymer' },
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain("structure_0.component({ selector: 'polymer' });");
    });

    test('generates componentFromUri', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              children: [
                {
                  kind: 'parse',
                  params: { format: 'mmcif' },
                  children: [
                    {
                      kind: 'structure',
                      params: { type: 'model' },
                      children: [
                        {
                          kind: 'component_from_uri',
                          params: {
                            uri: 'https://example.com/selection.json',
                            format: 'json',
                            schema: 'residue',
                          },
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain('const componentFromUri_0 = structure_0.componentFromUri(');
      expect(code).toContain("uri: 'https://example.com/selection.json'");
      expect(code).toContain("format: 'json'");
      expect(code).toContain("schema: 'residue'");
    });
  });

  describe('Complex Parameters', () => {
    test('formats nested objects', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              children: [
                {
                  kind: 'parse',
                  params: { format: 'mmcif' },
                  children: [
                    {
                      kind: 'structure',
                      params: { type: 'model' },
                      children: [
                        {
                          kind: 'component',
                          params: {
                            selector: {
                              label_asym_id: 'A',
                              label_seq_id: 10,
                            },
                          },
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain("selector: { label_asym_id: 'A', label_seq_id: 10 }");
    });

    test('formats custom properties', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              children: [
                {
                  kind: 'parse',
                  params: { format: 'mmcif' },
                  children: [
                    {
                      kind: 'structure',
                      params: { type: 'model' },
                      children: [
                        {
                          kind: 'component',
                          params: { selector: 'polymer' },
                          children: [
                            {
                              kind: 'representation',
                              params: { type: 'cartoon' },
                              children: [
                                {
                                  kind: 'color',
                                  params: {},
                                  custom: {
                                    molstar_color_theme_name: 'element-symbol',
                                    molstar_color_theme_params: {
                                      carbonColor: {
                                        name: 'uniform',
                                        params: { value: 4552626 },
                                      },
                                    },
                                  },
                                  children: [],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain('molstar_color_theme_name');
      expect(code).toContain('molstar_color_theme_params');
      expect(code).toContain('carbonColor');
    });
  });

  describe('Generator Options', () => {
    test('excludes section markers when disabled', () => {
      const json = {
        root: {
          kind: 'root',
          children: [],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).not.toContain('// Start of generated section');
      expect(code).not.toContain('// End of generated section');
    });

    test('uses custom builder variable name', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'canvas',
              params: { background_color: '#000000' },
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({
        includeSectionMarkers: false,
        builderVar: 'myBuilder',
      });
      const code = generator.generate(ast);

      expect(code).toContain('myBuilder.canvas');
      expect(code).not.toContain('builder.canvas');
    });

    test('includes comments when enabled', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({
        includeSectionMarkers: false,
        includeComments: true,
      });
      const code = generator.generate(ast);

      expect(code).toContain('// Download:');
    });
  });

  describe('Real-World Example', () => {
    test('generates code for 1OPL structure', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: {
                url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1opl.bcif',
              },
              children: [
                {
                  kind: 'parse',
                  params: { format: 'bcif' },
                  children: [
                    {
                      kind: 'structure',
                      params: { type: 'model' },
                      children: [
                        {
                          kind: 'transform',
                          params: {
                            rotation: [
                              -0.6321036327, 0.3450463255, 0.6938213248, -0.6288677634, -0.7515716885, -0.1991615756,
                              0.4527364948, -0.5622126202, 0.6920597055,
                            ],
                            translation: [36.39, 118.25, -26.49],
                          },
                        },
                        {
                          kind: 'component',
                          params: {
                            selector: { label_asym_id: 'A' },
                          },
                          children: [
                            {
                              kind: 'representation',
                              params: { type: 'cartoon' },
                              children: [
                                {
                                  kind: 'color',
                                  params: { color: '#4577B2' },
                                },
                              ],
                            },
                            {
                              kind: 'label',
                              params: { text: 'ABL Kinase' },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              kind: 'camera',
              params: {
                position: [79.47, 66.06, 20.82],
                target: [0.36, 55.32, 21.8],
                up: [-0.01, 0.01, -1],
              },
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      // Verify structure
      expect(code).toContain('builder.download');
      expect(code).toContain('1opl.bcif');
      expect(code).toContain('.parse');
      expect(code).toContain('bcif');
      expect(code).toContain('.modelStructure');
      expect(code).toContain('.transform');
      expect(code).toContain('.component');
      expect(code).toContain("label_asym_id: 'A'");
      expect(code).toContain('.representation');
      expect(code).toContain('cartoon');
      expect(code).toContain('.color');
      expect(code).toContain('#4577B2');
      expect(code).toContain('.label');
      expect(code).toContain('ABL Kinase');
      expect(code).toContain('.camera');
    });
  });
});
