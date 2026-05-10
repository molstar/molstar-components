import { describe, test, expect } from 'vitest';
import { ASTFactory } from '../../ast/factory.ts';
import { MVSNode } from '../../ast/node.ts';
import { ASTError } from '../../ast/types.ts';

describe('ASTFactory', () => {
  describe('fromMVSData - Valid Input', () => {
    test('converts minimal valid MVS JSON', () => {
      const json = {
        root: {
          kind: 'root',
          params: {},
          children: [],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);

      expect(ast).toBeDefined();
      expect(ast.root).toBeInstanceOf(MVSNode);
      expect(ast.root.kind).toBe('root');
      expect(ast.root.getChildrenCount()).toBe(0);
      expect(ast.metadata.timestamp).toBe('2024-01-01T00:00:00Z');
    });

    test('converts root without params', () => {
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

      expect(ast.root.params).toEqual({});
    });

    test('generates default metadata when missing', () => {
      const json = {
        root: {
          kind: 'root',
          children: [],
        },
      };

      const ast = ASTFactory.fromMVSData(json);

      expect(ast.metadata.timestamp).toBeDefined();
      expect(typeof ast.metadata.timestamp).toBe('string');
    });

    test('converts single-level nesting', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'https://example.com/data.cif' },
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);

      expect(ast.root.getChildrenCount()).toBe(1);
      const download = ast.root.getChildAt(0);
      expect(download).toBeDefined()
      expect(download!.kind).toBe('download');
      expect(download!.getParam('url')).toBe('https://example.com/data.cif');
    });

    test('converts deep nesting', () => {
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

      // Navigate 6 levels deep
      const download = ast.root.getChildAt(0);
      expect(download).toBeDefined();
      expect(download!.kind).toBe('download');

      const parse = download!.getChildAt(0);
      expect(parse).toBeDefined();
      expect(parse!.kind).toBe('parse');
      expect(parse!.getParam('format')).toBe('mmcif');

      const structure = parse!.getChildAt(0);
      expect(structure).toBeDefined();
      expect(structure!.kind).toBe('structure');
      expect(structure!.getParam('type')).toBe('model');
      expect(structure!.getParam('model_index')).toBe(0);

      const component = structure!.getChildAt(0);
      expect(component).toBeDefined();
      expect(component!.kind).toBe('component');
      expect(component!.getParam('selector')).toBe('polymer');

      const representation = component!.getChildAt(0);
      expect(representation).toBeDefined();
      expect(representation!.kind).toBe('representation');
      expect(representation!.getParam('type')).toBe('cartoon');

      const color = representation!.getChildAt(0);
      expect(color).toBeDefined();
      expect(color!.kind).toBe('color');
      expect(color!.getParam('color')).toBe('#FF0000');
    });

    test('converts multiple children at same level', () => {
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

      expect(ast.root.getChildrenCount()).toBe(3);
      expect(ast.root.getChildAt(0)?.kind).toBe('canvas');
      expect(ast.root.getChildAt(1)?.kind).toBe('camera');
      expect(ast.root.getChildAt(2)?.kind).toBe('download');
    });

    test('preserves ref property', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              ref: 'my-download-ref',
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const download = ast.root.getChildAt(0);
      expect(download).toBeDefined();

      expect(download!.ref).toBe('my-download-ref');
    });

    test('preserves custom properties', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              custom: {
                comment: 'test data',
                version: 2,
                metadata: { author: 'John' },
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
      const download = ast.root.getChildAt(0);
      expect(download).toBeDefined();

      expect(download!.custom).toEqual({
        comment: 'test data',
        version: 2,
        metadata: { author: 'John' },
      });
    });

    test('preserves both ref and custom', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              ref: 'dl-ref',
              custom: { note: 'important' },
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const download = ast.root.getChildAt(0);
      expect(download).toBeDefined();

      expect(download!.ref).toBe('dl-ref');
      expect(download!.custom).toEqual({ note: 'important' });
    });

    test('handles all parameter types', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'camera',
              params: {
                target: [1, 2, 3],
                position: [10.5, 20.5, 30.5],
                up: [0, 1, 0],
                near: 0.1,
              },
              children: [],
            },
            {
              kind: 'structure',
              params: {
                type: 'model',
                model_index: 5,
                block_header: 'test_block',
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

      const camera = ast.root.getChildAt(0);
      expect(camera).toBeDefined();
      expect(camera!.getParam('target')).toEqual([1, 2, 3]);
      expect(camera!.getParam('position')).toEqual([10.5, 20.5, 30.5]);
      expect(camera!.getParam('up')).toEqual([0, 1, 0]);
      expect(camera!.getParam('near')).toBe(0.1);

      const structure = ast.root.getChildAt(1);
      expect(structure).toBeDefined();
      expect(structure!.getParam('type')).toBe('model');
      expect(structure!.getParam('model_index')).toBe(5);
      expect(structure!.getParam('block_header')).toBe('test_block');
    });

    test('handles complex nested params', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'component',
              params: {
                selector: {
                  label_asym_id: 'A',
                  label_seq_id: 10,
                  label_atom_id: 'CA',
                },
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
      const component = ast.root.getChildAt(0);
      expect(component).toBeDefined();

      expect(component!.getParam('selector')).toEqual({
        label_asym_id: 'A',
        label_seq_id: 10,
        label_atom_id: 'CA',
      });
    });

    test('handles empty params object', () => {
      const json = {
        root: {
          kind: 'root',
          params: {},
          children: [
            {
              kind: 'coordinates',
              params: {},
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);
      const coords = ast.root.getChildAt(0);
      expect(coords).toBeDefined();

      expect(coords!.params).toEqual({});
    });

    test('handles all valid node kinds', () => {
      const allKinds = [
        'download',
        'parse',
        'coordinates',
        'structure',
        'transform',
        'instance',
        'component',
        'representation',
        'color',
        'opacity',
        'clip',
        'volume',
        'volume_representation',
        'label',
        'tooltip',
        'focus',
        'camera',
        'canvas',
        'primitives',
        'primitive',
      ];

      const children = allKinds.map(kind => ({
        kind,
        params: {},
        children: [],
      }));

      const json = {
        root: {
          kind: 'root',
          children,
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      const ast = ASTFactory.fromMVSData(json);

      expect(ast.root.getChildrenCount()).toBe(allKinds.length);
      allKinds.forEach((kind, index) => {
        expect(ast.root.getChildAt(index)?.kind).toBe(kind);
      });
    });
  });

  describe('fromMVSData - Invalid Input', () => {
    test('throws error for null input', () => {
      expect(() => ASTFactory.fromMVSData(null)).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData(null)).toThrow('must be an object');
    });

    test('throws error for undefined input', () => {
      expect(() => ASTFactory.fromMVSData(undefined)).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData(undefined)).toThrow('must be an object');
    });

    test('throws error for non-object primitives', () => {
      expect(() => ASTFactory.fromMVSData('string')).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData(123)).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData(true)).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData([])).toThrow(ASTError);
    });

    test('throws error for missing root', () => {
      const json = {
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData(json)).toThrow('missing root node');
    });

    test('throws error for null root', () => {
      const json = {
        root: null,
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
    });

    test('throws error for root with wrong kind', () => {
      const json = {
        root: {
          kind: 'download',
          params: {},
          children: [],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData(json)).toThrow('must have kind "root"');
    });

    test('throws error for missing kind in node', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              params: {},
              children: [],
            },
          ],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData(json)).toThrow('Invalid node structure');
    });

    test('throws error for invalid node kind', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'invalid_kind',
              params: {},
              children: [],
            },
          ],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData(json)).toThrow('Unknown node kind: invalid_kind');
    });

    test('throws error for params not being an object', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: 'not-an-object',
              children: [],
            },
          ],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData(json)).toThrow('Invalid node structure');
    });

    test('throws error for params being null', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: null,
              children: [],
            },
          ],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
    });

    test('throws error for children not being an array', () => {
      const json = {
        root: {
          kind: 'root',
          children: 'not-an-array',
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData(json)).toThrow('Invalid node structure');
    });

    test('throws error for children being object instead of array', () => {
      const json = {
        root: {
          kind: 'root',
          children: {},
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
    });

    test('throws error for ref not being a string', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              ref: 123,
              children: [],
            },
          ],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
    });

    test('throws error for custom not being an object', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              custom: 'not-an-object',
              children: [],
            },
          ],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
    });

    test('throws error for custom being null', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              custom: null,
              children: [],
            },
          ],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
    });

    test('throws error for multi-state MVS', () => {
      const json = {
        kind: 'multiple',
        snapshots: [],
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
      expect(() => ASTFactory.fromMVSData(json)).toThrow('not yet supported');
    });

    test('throws error with path for deeply nested invalid node', () => {
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
                      kind: 'invalid_kind',
                      params: {},
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      try {
        ASTFactory.fromMVSData(json);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ASTError);
        const astError = error as ASTError;
        expect(astError.path).toBeDefined();
        expect(astError.path).toContain('download');
        expect(astError.path).toContain('parse');
      }
    });

    test('throws error for invalid child deep in tree', () => {
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
                      // Missing kind
                      params: {},
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      expect(() => ASTFactory.fromMVSData(json)).toThrow(ASTError);
    });
  });

  describe('fromJSON', () => {
    test('parses valid JSON string', () => {
      const jsonString = JSON.stringify({
        root: {
          kind: 'root',
          children: [],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      });

      const ast = ASTFactory.fromJSON(jsonString);
      expect(ast.root.kind).toBe('root');
    });

    test('parses complex JSON string', () => {
      const jsonString = JSON.stringify({
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              ref: 'dl',
              custom: { note: 'test' },
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      });

      const ast = ASTFactory.fromJSON(jsonString);

      expect(ast.root.kind).toBe('root');
      const download = ast.root.getChildAt(0);
      expect(download).toBeDefined();
      expect(download!.getParam('url')).toBe('test.cif');
      expect(download!.ref).toBe('dl');
      expect(download!.custom).toEqual({ note: 'test' });
    });

    test('throws error for malformed JSON', () => {
      const malformed = '{ invalid json }';

      expect(() => ASTFactory.fromJSON(malformed)).toThrow(ASTError);
      expect(() => ASTFactory.fromJSON(malformed)).toThrow('Failed to parse JSON');
    });

    test('throws error for empty string', () => {
      expect(() => ASTFactory.fromJSON('')).toThrow(ASTError);
    });

    test('throws error for JSON with invalid MVS structure', () => {
      const jsonString = JSON.stringify({
        // Missing root
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      });

      expect(() => ASTFactory.fromJSON(jsonString)).toThrow(ASTError);
      expect(() => ASTFactory.fromJSON(jsonString)).toThrow('missing root node');
    });

    test('preserves all data through JSON roundtrip', () => {
      const original = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'download',
              params: { url: 'test.cif' },
              ref: 'dl-ref',
              custom: { note: 'test', version: 2 },
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

      const jsonString = JSON.stringify(original);
      const ast = ASTFactory.fromJSON(jsonString);

      // Verify structure
      expect(ast.root.kind).toBe('root');
      expect(ast.root.getChildrenCount()).toBe(1);

      const download = ast.root.getChildAt(0);
      expect(download).toBeDefined();
      expect(download!.kind).toBe('download');
      expect(download!.getParam('url')).toBe('test.cif');
      expect(download!.ref).toBe('dl-ref');
      expect(download!.custom).toEqual({ note: 'test', version: 2 });

      const parse = download!.getChildAt(0);
      expect(parse).toBeDefined();
      expect(parse!.kind).toBe('parse');
      expect(parse!.getParam('format')).toBe('mmcif');
    });

    test('handles JSON with unicode characters', () => {
      const jsonString = JSON.stringify({
        root: {
          kind: 'root',
          children: [
            {
              kind: 'label',
              params: { text: 'Protéine α-hélix 中文' },
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      });

      const ast = ASTFactory.fromJSON(jsonString);
      const label = ast.root.getChildAt(0);
      expect(label).toBeDefined();

      expect(label!.getParam('text')).toBe('Protéine α-hélix 中文');
    });

    test('handles JSON with escaped characters', () => {
      const jsonString = JSON.stringify({
        root: {
          kind: 'root',
          children: [
            {
              kind: 'label',
              params: { text: 'Line1\nLine2\tTabbed' },
              children: [],
            },
          ],
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
        },
      });

      const ast = ASTFactory.fromJSON(jsonString);
      const label = ast.root.getChildAt(0);
      expect(label).toBeDefined();

      expect(label!.getParam('text')).toBe('Line1\nLine2\tTabbed');
    });
  });

  describe('Error Details', () => {
    test('ASTError includes node data', () => {
      const json = {
        root: {
          kind: 'root',
          children: [
            {
              kind: 'invalid_kind',
              params: { test: 'data' },
              children: [],
            },
          ],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      try {
        ASTFactory.fromMVSData(json);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ASTError);
        const astError = error as ASTError;
        expect(astError.node).toBeDefined();
        expect(astError.message).toContain('invalid_kind');
      }
    });

    test('ASTError includes path for nested errors', () => {
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
                      kind: 'bad_kind',
                      params: {},
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        metadata: { timestamp: '2024-01-01T00:00:00Z' },
      };

      try {
        ASTFactory.fromMVSData(json);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ASTError);
        const astError = error as ASTError;
        expect(astError.path).toBeDefined();
        expect(astError.path?.length).toBeGreaterThan(2);
      }
    });
  });
});