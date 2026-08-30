'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import type { UINode } from '../../state-builder/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import { FieldRemappingSection, type RemapEntry } from '../components/FieldRemappingSection.tsx';
import { useAnnotationSourceState } from './annotation-source-state.ts';

interface LabelFromSourceHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

function fieldRemappingFromNode(node: UINode): RemapEntry[] {
  return Object.entries((node.params.field_remapping as Record<string, string>) ?? {}).map(([key, value]) => ({ key, value }));
}

export function LabelFromSourceHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: LabelFromSourceHelperProps) {
  const source = useAnnotationSourceState(node);
  const [fieldRemapping, setFieldRemapping] = useState<RemapEntry[]>(fieldRemappingFromNode(node));

  const handleDialogOpen = () => {
    source.reset();
    setFieldRemapping(fieldRemappingFromNode(node));
  };

  const handleApply = (ref: string) => {
    const params = source.applyParams(node.params);
    const remapping = Object.fromEntries(fieldRemapping.filter(e => e.key).map(e => [e.key, e.value]));
    if (Object.keys(remapping).length > 0) params.field_remapping = remapping;
    else delete params.field_remapping;
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
        id: 'form', label: 'Label from Source',
        content: (
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Category name</Label>
              <Input className='h-7 text-xs font-mono' placeholder='_struct' value={source.categoryName} onChange={(e) => source.setCategoryName(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Field name</Label>
              <Input className='h-7 text-xs font-mono' placeholder='label' value={source.fieldName} onChange={(e) => source.setFieldName(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1 w-28'>
              <Label className='text-xs'>Block index</Label>
              <Input className='h-7 text-xs font-mono' type='number' min='0' placeholder='optional' value={source.blockIndex ?? ''} onChange={(e) => source.setBlockIndex(e.target.value === '' ? undefined : parseInt(e.target.value))} />
            </div>
            <FieldRemappingSection entries={fieldRemapping} onChange={setFieldRemapping} />
          </div>
        ),
      }]}
    />
  );
}
