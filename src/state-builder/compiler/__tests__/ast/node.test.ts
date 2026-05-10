import { describe, test, expect } from 'vitest';
import { MVSNode } from '../../ast/node.ts';

describe('MVSNode', () => {
  describe('constructor', () => {
    test('creates node with all properties', () => {
      const node = new MVSNode(
        'download',
        { url: 'test.cif' },
        [],
        'my-ref',
        { custom: 'data' }
      );

      expect(node.kind).toBe('download');
      expect(node.params).toEqual({ url: 'test.cif' });
      expect(node.getChildrenCount()).toBe(0);
      expect(node.ref).toBe('my-ref');
      expect(node.custom).toEqual({ custom: 'data' });
    });

    test('creates node without optional properties', () => {
      const node = new MVSNode('root', {}, []);

      expect(node.kind).toBe('root');
      expect(node.params).toEqual({});
      expect(node.getChildrenCount()).toBe(0);
      expect(node.ref).toBeUndefined();
      expect(node.custom).toBeUndefined();
    });
  });

  describe('getChildren', () => {

    test('returns all children when no kind specified', () => {
      const root = new MVSNode('root', {}, [
        new MVSNode('download', { url: 'first.cif' }, []),
        new MVSNode('camera', { target: [0, 0, 0], position: [1, 1, 1] }, []),
        new MVSNode('download', { url: 'second.cif' }, []),
      ]);

      const children = root.getChildren();
      expect(children).toHaveLength(3);
    });

    test('filters children by kind', () => {
      const root = new MVSNode('root', {}, [
        new MVSNode('download', { url: 'first.cif' }, []),
        new MVSNode('download', { url: 'second.cif' }, []),
        new MVSNode('camera', { target: [0, 0, 0], position: [1, 1, 1] }, []),
      ]);

      const downloads = root.getChildren('download');
      expect(downloads).toHaveLength(2);
      expect(downloads[0].kind).toBe('download');
      expect(downloads[1].kind).toBe('download');
    });

    test('returns empty array when no children match', () => {
      const root = new MVSNode('root', {}, [
        new MVSNode('download', { url: 'test.cif' }, []),
      ]);

      const cameras = root.getChildren('camera');
      expect(cameras).toHaveLength(0);
    });

    test('returns empty array when node has no children', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      expect(node.getChildren()).toHaveLength(0);
      expect(node.getChildren('parse')).toHaveLength(0);
    });
  });

  describe('getChild', () => {
    test('returns first child of specified kind', () => {
      const root = new MVSNode('root', {}, [
        new MVSNode('download', { url: 'first.cif' }, []),
        new MVSNode('download', { url: 'second.cif' }, []),
      ]);

      const download = root.getChild('download');
      expect(download).toBeDefined();
      expect(download?.getParam('url')).toBe('first.cif');
    });

    test('returns undefined when no child matches', () => {
      const root = new MVSNode('root', {}, [
        new MVSNode('download', { url: 'test.cif' }, []),
      ]);

      const camera = root.getChild('camera');
      expect(camera).toBeUndefined();
    });

    test('returns undefined when node has no children', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      expect(node.getChild('parse')).toBeUndefined();
    });
  });

  describe('getParam', () => {
    test('returns parameter value when it exists', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      expect(node.getParam('url')).toBe('test.cif');
    });

    test('returns undefined for missing parameter', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      expect(node.getParam('block_index')).toBeUndefined();
    });

    test('returns default value when parameter missing', () => {
      const node = new MVSNode('structure', { type: 'model' }, []);

      expect(node.getParam('model_index', 0)).toBe(0);
      expect(node.getParam('assembly_id', null)).toBe(null);
    });

    test('returns actual value over default when parameter exists', () => {
      const node = new MVSNode('structure', { type: 'model', model_index: 5 }, []);

      expect(node.getParam('model_index', 0)).toBe(5);
    });

    test('handles falsy values correctly', () => {
      const node = new MVSNode('test' as any, { value: 0, flag: false }, []);

      expect(node.getParam('value')).toBe(0);
      expect(node.getParam('flag')).toBe(false);
      expect(node.getParam('value', 10)).toBe(0);
      expect(node.getParam('flag', true)).toBe(false);
    });
  });

  describe('is', () => {
    test('returns true for matching kind', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      expect(node.is('download')).toBe(true);
    });

    test('returns false for non-matching kind', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      expect(node.is('parse')).toBe(false);
      expect(node.is('structure')).toBe(false);
    });

    test('works as type guard', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      if (node.is('download')) {
        // TypeScript should know this is a download node
        const url = node.getParam('url');
        expect(typeof url).toBe('string');
      }
    });
  });

  describe('isOneOf', () => {
    test('returns true when kind matches any provided', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      expect(node.isOneOf('download', 'parse')).toBe(true);
      expect(node.isOneOf('parse', 'download', 'structure')).toBe(true);
    });

    test('returns false when kind matches none', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      expect(node.isOneOf('parse', 'structure')).toBe(false);
    });

    test('works with single kind', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      expect(node.isOneOf('download')).toBe(true);
      expect(node.isOneOf('parse')).toBe(false);
    });
  });

  describe('hasChildren', () => {
    test('returns true when node has children', () => {
      const node = new MVSNode('root', {}, [
        new MVSNode('download', { url: 'test.cif' }, []),
      ]);

      expect(node.hasChildren()).toBe(true);
    });

    test('returns false when node has no children', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      expect(node.hasChildren()).toBe(false);
    });

    test('returns false for node with empty children array', () => {
      const node = new MVSNode('root', {}, []);

      expect(node.hasChildren()).toBe(false);
    });
  });

  describe('toJSON', () => {
    test('converts node to plain object', () => {
      const node = new MVSNode(
        'download',
        { url: 'test.cif' },
        [new MVSNode('parse', { format: 'mmcif' }, [])],
        'my-ref',
        { custom: 'data' }
      );

      const json = node.toJSON();

      expect(json.kind).toBe('download');
      expect(json.params).toEqual({ url: 'test.cif' });
      expect(json.children).toHaveLength(1);
      expect(json.children[0].kind).toBe('parse');
      expect(json.ref).toBe('my-ref');
      expect(json.custom).toEqual({ custom: 'data' });
    });

    test('omits undefined ref and custom', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, []);

      const json = node.toJSON();

      expect(json.ref).toBeUndefined();
      expect(json.custom).toBeUndefined();
      expect('ref' in json).toBe(false);
      expect('custom' in json).toBe(false);
    });

    test('handles nested children correctly', () => {
      const node = new MVSNode('root', {}, [
        new MVSNode('download', { url: 'test.cif' }, [
          new MVSNode('parse', { format: 'mmcif' }, [
            new MVSNode('structure', { type: 'model' }, []),
          ]),
        ]),
      ]);

      const json = node.toJSON();

      expect(json.children[0].children[0].children[0].kind).toBe('structure');
    });
  });

  describe('toString', () => {
    test('generates readable string representation', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, [
        new MVSNode('parse', { format: 'mmcif' }, []),
      ]);

      const str = node.toString();

      expect(str).toContain('download');
      expect(str).toContain('url');
      expect(str).toContain('test.cif');
      expect(str).toContain('parse');
      expect(str).toContain('format');
      expect(str).toContain('mmcif');
    });

    test('shows ref when present', () => {
      const node = new MVSNode('download', { url: 'test.cif' }, [], 'my-ref');

      const str = node.toString();

      expect(str).toContain('[ref=my-ref]');
    });

    test('indents children correctly', () => {
      const node = new MVSNode('root', {}, [
        new MVSNode('download', { url: 'test.cif' }, [
          new MVSNode('parse', { format: 'mmcif' }, []),
        ]),
      ]);

      const str = node.toString();
      const lines = str.split('\n');

      expect(lines[0]).toMatch(/^root/);
      expect(lines[1]).toMatch(/^  download/);
      expect(lines[2]).toMatch(/^    parse/);
    });

    test('handles empty params', () => {
      const node = new MVSNode('root', {}, []);

      const str = node.toString();

      expect(str).toBe('root\n');
    });
  });
});