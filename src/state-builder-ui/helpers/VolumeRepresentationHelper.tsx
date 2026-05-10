'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Label } from '../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select.tsx';
import type { UINode } from '@molstar/state-builder';
import { VOLUME_REPRESENTATION_TYPES, getActiveValues } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface VolumeRepresentationHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

export function VolumeRepresentationHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: VolumeRepresentationHelperProps) {
  const [type, setType] = useState((node.params.type as string) ?? '');
  const handleDialogOpen = () => setType((node.params.type as string) ?? '');
  const handleApply = (ref: string) => onUpdate({ params: { ...node.params, type }, ...(ref ? { ref } : {}) });
  const handleRawApply = (params: Record<string, unknown>, ref: string) => onUpdate({ params, ...(ref ? { ref } : {}) });
  const types = getActiveValues(VOLUME_REPRESENTATION_TYPES);
  return (
    <NodeHelperBase node={node} onApply={handleApply} onRawApply={handleRawApply} onDialogOpen={handleDialogOpen} open={open} onOpenChange={onOpenChange} trigger={trigger} onCustomChange={onCustomChange}
      tabs={[{
        id: 'form', label: 'Volume Representation',
        content: (
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger size='sm'><SelectValue placeholder='Select type' /></SelectTrigger>
              <SelectContent>{types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ),
      }]}
    />
  );
}
