import { describe, test, expect } from 'vitest';
import { parseSelector, formatSelectorPreview, parseMolqlInput } from '../index.ts';

const EXPR = {
  head: { name: 'structure-query.generator.atom-groups' },
  args: {
    'chain-test': {
      head: { name: 'core.rel.eq' },
      args: [{ name: 'structure.atom-property.macromolecular.label_asym_id' }, 'A'],
    },
  },
};

describe('molql selector support', () => {
  test('parseSelector recognizes a { molql } wrapper', () => {
    const result = parseSelector({ molql: EXPR });
    expect(result.mode).toEqual('molql');
    expect(result.molqlValue).toEqual(EXPR);
    expect(result.molqlStructureRef).toBeUndefined();
  });

  test('parseSelector recognizes structure_ref alongside molql', () => {
    const result = parseSelector({ molql: EXPR, structure_ref: 'other' });
    expect(result.mode).toEqual('molql');
    expect(result.molqlStructureRef).toEqual('other');
  });

  test('parseSelector does not treat a molql wrapper as a plain expression selector', () => {
    const result = parseSelector({ molql: EXPR });
    expect(result.mode).not.toEqual('expression');
  });

  test('formatSelectorPreview labels molql selectors', () => {
    expect(formatSelectorPreview({ molql: EXPR })).toEqual('MolQL Selection');
  });

  test('parseMolqlInput accepts a valid Apply-shaped expression', () => {
    const result = parseMolqlInput(JSON.stringify(EXPR));
    expect(result.error).toBeUndefined();
    expect(result.value).toEqual(EXPR);
  });

  test('parseMolqlInput rejects invalid JSON', () => {
    const result = parseMolqlInput('{ not json');
    expect(result.error).toEqual('Invalid JSON syntax');
  });

  test('parseMolqlInput rejects JSON without a head property', () => {
    const result = parseMolqlInput('{ "foo": "bar" }');
    expect(result.error).toContain('head');
  });

  test('parseMolqlInput rejects empty input', () => {
    const result = parseMolqlInput('   ');
    expect(result.error).toEqual('Empty input');
  });
});
