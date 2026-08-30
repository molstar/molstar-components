import { describe, test, expect } from 'vitest';
import { ASTFactory } from '../../ast/factory.ts';
import { CodeGenerator } from '../../codegen/generator.ts';
import { ParamFormatter } from '../../codegen/formatters.ts';
import {
  ConstantDefinition,
  ConstantRef,
  createConstantRef,
  createEmptyConstant,
  isConstantRef,
} from '../../../core/index.ts';

describe('Constants Feature', () => {
  describe('Type Guards and Helpers', () => {
    test('isConstantRef returns true for valid ConstantRef', () => {
      const ref: ConstantRef = {
        __constantRef: true,
        constantName: 'Colors',
        entryKey: 'primary',
      };
      expect(isConstantRef(ref)).toBe(true);
    });

    test('isConstantRef returns false for non-ConstantRef values', () => {
      expect(isConstantRef(null)).toBe(false);
      expect(isConstantRef(undefined)).toBe(false);
      expect(isConstantRef('string')).toBe(false);
      expect(isConstantRef(123)).toBe(false);
      expect(isConstantRef({ color: '#FF0000' })).toBe(false);
      expect(isConstantRef({ __constantRef: false, constantName: 'A', entryKey: 'b' })).toBe(false);
    });

    test('createConstantRef creates valid ConstantRef', () => {
      const ref = createConstantRef('Colors', 'primary');
      expect(ref.__constantRef).toBe(true);
      expect(ref.constantName).toBe('Colors');
      expect(ref.entryKey).toBe('primary');
      expect(isConstantRef(ref)).toBe(true);
    });

    test('createEmptyConstant creates valid empty constant', () => {
      const constant = createEmptyConstant('colors');
      expect(constant.id).toBeTruthy();
      expect(constant.name).toBe('');
      expect(constant.type).toBe('colors');
      expect(constant.entries).toEqual([]);
    });

    test('createEmptyConstant defaults to generic type', () => {
      const constant = createEmptyConstant();
      expect(constant.type).toBe('generic');
    });
  });

  describe('CodeGenerator - Constants Declaration', () => {
    const baseJson = {
      root: {
        kind: 'root',
        children: [],
      },
      metadata: {
        timestamp: '2024-01-01T00:00:00Z',
      },
    };

    test('generates no constants when none provided', () => {
      const ast = ASTFactory.fromMVSData(baseJson);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).not.toContain('const Colors');
      expect(code).not.toContain('// Constants');
    });

    test('generates single constant declaration', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: 'Colors',
          type: 'colors',
          entries: [
            { key: 'primary', value: '#4577B2' },
            { key: 'secondary', value: '#BF99A1' },
          ],
        },
      ];

      const ast = ASTFactory.fromMVSData(baseJson);
      const generator = new CodeGenerator({
        includeSectionMarkers: false,
        includeComments: true,
        constants,
      });
      const code = generator.generate(ast);

      expect(code).toContain('// Constants');
      expect(code).toContain('/** @type {Record<string, ColorT>} */');
      expect(code).toContain('const Colors = {');
      expect(code).toContain("primary: '#4577B2'");
      expect(code).toContain("secondary: '#BF99A1'");
      expect(code).toContain('};');
    });

    test('adds JSDoc type annotation for color constants only', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: 'Colors',
          type: 'colors',
          entries: [{ key: 'main', value: '#FF0000' }],
        },
        {
          id: '2',
          name: 'Urls',
          type: 'urls',
          entries: [{ key: 'api', value: 'https://example.com' }],
        },
        {
          id: '3',
          name: 'Config',
          type: 'generic',
          entries: [{ key: 'key', value: 'value' }],
        },
      ];

      const ast = ASTFactory.fromMVSData(baseJson);
      const generator = new CodeGenerator({
        includeSectionMarkers: false,
        constants,
      });
      const code = generator.generate(ast);

      // Count occurrences of the JSDoc annotation
      const jsdocMatches = code.match(/\/\*\* @type \{Record<string, ColorT>\} \*\//g) || [];
      expect(jsdocMatches).toHaveLength(1);

      // Verify it appears before Colors constant
      const jsdocIndex = code.indexOf('/** @type {Record<string, ColorT>} */');
      const colorsIndex = code.indexOf('const Colors');
      const urlsIndex = code.indexOf('const Urls');

      expect(jsdocIndex).toBeLessThan(colorsIndex);
      expect(jsdocIndex).toBeLessThan(urlsIndex);
    });

    test('generates multiple constant declarations', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: 'Colors',
          type: 'colors',
          entries: [{ key: 'main', value: '#FF0000' }],
        },
        {
          id: '2',
          name: 'Urls',
          type: 'urls',
          entries: [{ key: 'pdb', value: 'https://files.rcsb.org' }],
        },
      ];

      const ast = ASTFactory.fromMVSData(baseJson);
      const generator = new CodeGenerator({
        includeSectionMarkers: false,
        constants,
      });
      const code = generator.generate(ast);

      expect(code).toContain('const Colors = {');
      expect(code).toContain("main: '#FF0000'");
      expect(code).toContain('const Urls = {');
      expect(code).toContain("pdb: 'https://files.rcsb.org'");
    });

    test('skips constants without name', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: '',
          type: 'colors',
          entries: [{ key: 'primary', value: '#FF0000' }],
        },
      ];

      const ast = ASTFactory.fromMVSData(baseJson);
      const generator = new CodeGenerator({
        includeSectionMarkers: false,
        constants,
      });
      const code = generator.generate(ast);

      expect(code).not.toContain('const  = {');
      expect(code).not.toContain('primary');
    });

    test('skips constants with empty entries', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: 'Empty',
          type: 'colors',
          entries: [],
        },
      ];

      const ast = ASTFactory.fromMVSData(baseJson);
      const generator = new CodeGenerator({
        includeSectionMarkers: false,
        constants,
      });
      const code = generator.generate(ast);

      expect(code).not.toContain('const Empty');
    });

    test('skips entries without keys', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: 'Colors',
          type: 'colors',
          entries: [
            { key: '', value: '#FF0000' },
            { key: 'valid', value: '#00FF00' },
          ],
        },
      ];

      const ast = ASTFactory.fromMVSData(baseJson);
      const generator = new CodeGenerator({
        includeSectionMarkers: false,
        constants,
      });
      const code = generator.generate(ast);

      expect(code).toContain('const Colors = {');
      expect(code).toContain("valid: '#00FF00'");
      expect(code).not.toContain(": '#FF0000'");
    });

    test('quotes keys that are not valid identifiers', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: 'Colors',
          type: 'colors',
          entries: [
            { key: 'valid_key', value: '#FF0000' },
            { key: 'key-with-dash', value: '#00FF00' },
            { key: '123numeric', value: '#0000FF' },
          ],
        },
      ];

      const ast = ASTFactory.fromMVSData(baseJson);
      const generator = new CodeGenerator({
        includeSectionMarkers: false,
        constants,
      });
      const code = generator.generate(ast);

      expect(code).toContain("valid_key: '#FF0000'");
      expect(code).toContain("'key-with-dash': '#00FF00'");
      expect(code).toContain("'123numeric': '#0000FF'");
    });

    test('escapes special characters in values', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: 'Strings',
          type: 'generic',
          entries: [
            { key: 'withQuote', value: "it's a test" },
            { key: 'withBackslash', value: 'path\\to\\file' },
            { key: 'withNewline', value: 'line1\nline2' },
          ],
        },
      ];

      const ast = ASTFactory.fromMVSData(baseJson);
      const generator = new CodeGenerator({
        includeSectionMarkers: false,
        constants,
      });
      const code = generator.generate(ast);

      expect(code).toContain("withQuote: 'it\\'s a test'");
      expect(code).toContain("withBackslash: 'path\\\\to\\\\file'");
      expect(code).toContain("withNewline: 'line1\\nline2'");
    });

    test('constants appear before node code', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: 'Colors',
          type: 'colors',
          entries: [{ key: 'primary', value: '#4577B2' }],
        },
      ];

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
        constants,
      });
      const code = generator.generate(ast);

      const colorsIndex = code.indexOf('const Colors');
      const downloadIndex = code.indexOf('builder.download');

      expect(colorsIndex).toBeLessThan(downloadIndex);
    });
  });

  describe('ParamFormatter - ConstantRef Handling', () => {
    test('formats ConstantRef as unquoted identifier', () => {
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
                                  params: {
                                    color: {
                                      __constantRef: true,
                                      constantName: 'Colors',
                                      entryKey: 'primary',
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

      // Should output Colors.primary without quotes
      expect(code).toContain('color: Colors.primary');
      expect(code).not.toContain("color: 'Colors.primary'");
    });

    test('formats ConstantRef in nested objects', () => {
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
                              nested: {
                                value: {
                                  __constantRef: true,
                                  constantName: 'Values',
                                  entryKey: 'test',
                                },
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
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const generator = new CodeGenerator({ includeSectionMarkers: false });
      const code = generator.generate(ast);

      expect(code).toContain('value: Values.test');
    });
  });

  describe('End-to-End: Constants with References', () => {
    test('generates complete code with constants and references', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: 'Colors',
          type: 'colors',
          entries: [
            { key: 'protein', value: '#4577B2' },
            { key: 'ligand', value: '#BF99A1' },
          ],
        },
      ];

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
                                  params: {
                                    color: createConstantRef('Colors', 'protein'),
                                  },
                                  children: [],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          kind: 'component',
                          params: { selector: 'ligand' },
                          children: [
                            {
                              kind: 'representation',
                              params: { type: 'ball_and_stick' },
                              children: [
                                {
                                  kind: 'color',
                                  params: {
                                    color: createConstantRef('Colors', 'ligand'),
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
      const generator = new CodeGenerator({
        includeSectionMarkers: true,
        includeComments: true,
        constants,
      });
      const code = generator.generate(ast);

      // Check structure
      expect(code).toContain('// Start of generated section');
      expect(code).toContain('// Constants');
      expect(code).toContain('const Colors = {');
      expect(code).toContain("protein: '#4577B2'");
      expect(code).toContain("ligand: '#BF99A1'");

      // Check references are used
      expect(code).toContain('color: Colors.protein');
      expect(code).toContain('color: Colors.ligand');

      // Verify order: constants before code
      const constantsIndex = code.indexOf('const Colors');
      const downloadIndex = code.indexOf('builder.download');
      expect(constantsIndex).toBeLessThan(downloadIndex);
    });

    test('generates valid JavaScript syntax', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: 'Config',
          type: 'generic',
          entries: [
            { key: 'url', value: 'https://example.com' },
            { key: 'format', value: 'mmcif' },
          ],
        },
      ];

      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'canvas',
              params: { background_color: '#FFFFFF' },
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
        constants,
      });
      const code = generator.generate(ast);

      // This should be parseable JavaScript
      // We can't actually eval it without the builder, but we can check syntax
      expect(() => {
        // Check that the generated code is syntactically valid
        new Function('builder', code);
      }).not.toThrow();
    });
  });

  describe('Generator Reset', () => {
    test('reset clears constants state', () => {
      const constants: ConstantDefinition[] = [
        {
          id: '1',
          name: 'Colors',
          type: 'colors',
          entries: [{ key: 'primary', value: '#FF0000' }],
        },
      ];

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
      const generator = new CodeGenerator({
        includeSectionMarkers: false,
        constants,
      });

      // Generate first time
      const code1 = generator.generate(ast);
      expect(code1).toContain('const Colors');

      // Reset and generate again (constants are in options, should still appear)
      generator.reset();
      const code2 = generator.generate(ast);
      expect(code2).toContain('const Colors');

      // Both outputs should be identical
      expect(code1).toBe(code2);
    });
  });
});
