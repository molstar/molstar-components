'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import type { UINode } from '../../state-builder/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import { FieldRemappingSection, type RemapEntry } from '../components/FieldRemappingSection.tsx';
import { PaletteSection, paletteFromParams, paletteToParams, type PaletteValue } from '../components/PaletteSection.tsx';

interface ColorFromSourceHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

function initFromNode(node: UINode) {
  const p = node.params as Record<string, unknown>;
  return {
    categoryName: (p.category_name as string) ?? '',
    fieldName: (p.field_name as string) ?? '',
    blockIndex: p.block_index as number | undefined,
    fieldRemapping: Object.entries((p.field_remapping as Record<string, string>) ?? {}).map(([key, value]) => ({ key, value })),
    palette: paletteFromParams(p),
  };
}

export function ColorFromSourceHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: ColorFromSourceHelperProps) {
  const init = initFromNode(node);
  const [categoryName, setCategoryName] = useState(init.categoryName);
  const [fieldName, setFieldName] = useState(init.fieldName);
  const [blockIndex, setBlockIndex] = useState<number | undefined>(init.blockIndex);
  const [fieldRemapping, setFieldRemapping] = useState<RemapEntry[]>(init.fieldRemapping);
  const [palette, setPalette] = useState<PaletteValue | null>(init.palette);

  const handleDialogOpen = () => {
    const s = initFromNode(node);
    setCategoryName(s.categoryName);
    setFieldName(s.fieldName);
    setBlockIndex(s.blockIndex);
    setFieldRemapping(s.fieldRemapping);
    setPalette(s.palette);
  };

  const handleApply = (ref: string) => {
    const params: Record<string, unknown> = { ...node.params, category_name: categoryName, field_name: fieldName };
    if (blockIndex !== undefined) params.block_index = blockIndex;
    else delete params.block_index;
    const remapping = Object.fromEntries(fieldRemapping.filter(e => e.key).map(e => [e.key, e.value]));
    if (Object.keys(remapping).length > 0) params.field_remapping = remapping;
    else delete params.field_remapping;
    const paletteParams = paletteToParams(palette);
    if (paletteParams) params.palette = paletteParams;
    else delete params.palette;
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
        id: 'form', label: 'Color from Source',
        content: (
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Category name</Label>
              <Input className='h-7 text-xs font-mono' placeholder='_struct' value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Field name</Label>
              <Input className='h-7 text-xs font-mono' placeholder='color' value={fieldName} onChange={(e) => setFieldName(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1 w-28'>
              <Label className='text-xs'>Block index</Label>
              <Input className='h-7 text-xs font-mono' type='number' min='0' placeholder='optional' value={blockIndex ?? ''} onChange={(e) => setBlockIndex(e.target.value === '' ? undefined : parseInt(e.target.value))} />
            </div>
            <PaletteSection value={palette} onChange={setPalette} />
            <FieldRemappingSection entries={fieldRemapping} onChange={setFieldRemapping} />
          </div>
        ),
      }]}
    />
  );
}
