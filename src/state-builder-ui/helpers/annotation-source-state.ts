import { useState } from 'react';
import type { UINode } from '../../state-builder/index.ts';
import type { RemapEntry } from '../components/FieldRemappingSection.tsx';

/** Shared by the Color/Label/Tooltip FromSource helpers, whose field_remapping shape is identical. */
export function fieldRemappingFromNode(node: UINode): RemapEntry[] {
  return Object.entries((node.params.field_remapping as Record<string, string>) ?? {}).map(([key, value]) => ({ key, value }));
}

function sourceFieldsFromNode(node: UINode) {
  const p = node.params;
  return {
    categoryName: (p.category_name as string) ?? '',
    fieldName: (p.field_name as string) ?? '',
    blockIndex: p.block_index as number | undefined,
  };
}

/**
 * Shared category_name/field_name/block_index state for the 4 *FromSourceHelper.tsx
 * files. field_remapping (Color/Label/Tooltip) and selector (Component) are
 * kind-specific extras layered on top of applyParams's result by each caller.
 */
export function useAnnotationSourceState(node: UINode) {
  const init = sourceFieldsFromNode(node);
  const [categoryName, setCategoryName] = useState(init.categoryName);
  const [fieldName, setFieldName] = useState(init.fieldName);
  const [blockIndex, setBlockIndex] = useState<number | undefined>(init.blockIndex);

  const reset = () => {
    const s = sourceFieldsFromNode(node);
    setCategoryName(s.categoryName);
    setFieldName(s.fieldName);
    setBlockIndex(s.blockIndex);
  };

  const applyParams = (base: Record<string, unknown>): Record<string, unknown> => {
    const params: Record<string, unknown> = { ...base, category_name: categoryName, field_name: fieldName };
    if (blockIndex !== undefined) params.block_index = blockIndex;
    else delete params.block_index;
    return params;
  };

  return { categoryName, setCategoryName, fieldName, setFieldName, blockIndex, setBlockIndex, reset, applyParams };
}

function uriFieldsFromNode(node: UINode) {
  const p = node.params;
  return {
    uri: (p.uri as string) ?? '',
    format: (p.format as string) ?? 'cif',
    schema: (p.schema as string) ?? 'all_atomic',
    categoryName: (p.category_name as string) ?? '',
    fieldName: (p.field_name as string) ?? '',
  };
}

/**
 * Shared uri/format/schema/category_name/field_name state for the 3 *FromUriHelper.tsx
 * files that share this shape (Color, Label, Tooltip — NOT Component, whose FromUri
 * variant is just uri+selector).
 */
export function useAnnotationUriState(node: UINode) {
  const init = uriFieldsFromNode(node);
  const [uri, setUri] = useState(init.uri);
  const [format, setFormat] = useState(init.format);
  const [schema, setSchema] = useState(init.schema);
  const [categoryName, setCategoryName] = useState(init.categoryName);
  const [fieldName, setFieldName] = useState(init.fieldName);

  const reset = () => {
    const s = uriFieldsFromNode(node);
    setUri(s.uri);
    setFormat(s.format);
    setSchema(s.schema);
    setCategoryName(s.categoryName);
    setFieldName(s.fieldName);
  };

  const applyParams = (base: Record<string, unknown>): Record<string, unknown> => ({
    ...base,
    uri,
    format,
    schema,
    category_name: categoryName || undefined,
    field_name: fieldName || undefined,
  });

  return { uri, setUri, format, setFormat, schema, setSchema, categoryName, setCategoryName, fieldName, setFieldName, reset, applyParams };
}
