'use client';

// TODO: ColorFromUriHelper, TooltipFromUriHelper, and LabelFromUriHelper share the same
// uri/format/schema/category_name/field_name form shape. Consider extracting a shared
// FromUriHelperForm component to avoid the duplication.

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select.tsx';
import type { UINode } from '../../state-builder/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface TooltipFromUriHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

const FORMATS = ['cif', 'bcif', 'json'] as const;
const SCHEMAS = [
  'whole_structure', 'entity', 'chain', 'auth_chain',
  'residue', 'auth_residue', 'residue_range', 'auth_residue_range',
  'atom', 'auth_atom', 'all_atomic',
] as const;

function initFromNode(node: UINode) {
  const p = node.params;
  return {
    uri: (p.uri as string) ?? '',
    format: (p.format as string) ?? 'cif',
    schema: (p.schema as string) ?? 'all_atomic',
    categoryName: (p.category_name as string) ?? '',
    fieldName: (p.field_name as string) ?? '',
  };
}

export function TooltipFromUriHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: TooltipFromUriHelperProps) {
  const init = initFromNode(node);
  const [uri, setUri] = useState(init.uri);
  const [format, setFormat] = useState(init.format);
  const [schema, setSchema] = useState(init.schema);
  const [categoryName, setCategoryName] = useState(init.categoryName);
  const [fieldName, setFieldName] = useState(init.fieldName);

  const handleDialogOpen = () => {
    const s = initFromNode(node);
    setUri(s.uri);
    setFormat(s.format);
    setSchema(s.schema);
    setCategoryName(s.categoryName);
    setFieldName(s.fieldName);
  };

  const handleApply = (ref: string) => {
    const params: Record<string, unknown> = {
      ...node.params,
      uri,
      format,
      schema,
      category_name: categoryName || undefined,
      field_name: fieldName || undefined,
    };
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  const handleRawApply = (params: Record<string, unknown>, ref: string) => {
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  return (
    <NodeHelperBase
      node={node}
      onApply={handleApply}
      onRawApply={handleRawApply}
      onDialogOpen={handleDialogOpen}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      onCustomChange={onCustomChange}
      tabs={[{
        id: 'form', label: 'Tooltip from URI',
        content: (
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>URI</Label>
              <Input className='h-7 text-sm font-mono' placeholder='https://...' value={uri} onChange={(e) => setUri(e.target.value)} />
            </div>
            <div className='flex gap-3'>
              <div className='flex flex-col gap-1 flex-1'>
                <Label className='text-xs'>Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger size='sm'><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1 flex-1'>
                <Label className='text-xs'>Schema</Label>
                <Select value={schema} onValueChange={setSchema}>
                  <SelectTrigger size='sm'><SelectValue /></SelectTrigger>
                  <SelectContent>{SCHEMAS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className='flex gap-3'>
              <div className='flex flex-col gap-1 flex-1'>
                <Label className='text-xs'>Category name <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                <Input className='h-7 text-xs font-mono' placeholder='annotations' value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
              </div>
              <div className='flex flex-col gap-1 flex-1'>
                <Label className='text-xs'>Field name <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                <Input className='h-7 text-xs font-mono' placeholder='tooltip' value={fieldName} onChange={(e) => setFieldName(e.target.value)} />
              </div>
            </div>
          </div>
        ),
      }]}
    />
  );
}
