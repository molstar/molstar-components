'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Label } from '../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select.tsx';
import type { UINode } from '../../state-builder/index.ts';
import { PARSE_FORMATS, getActiveValues } from '../../state-builder/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface ParseHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

function ParseForm({ format, onFormatChange }: { format: string; onFormatChange: (v: string) => void }) {
  const formats = getActiveValues(PARSE_FORMATS);
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>Format</Label>
      <Select value={format} onValueChange={onFormatChange}>
        <SelectTrigger size='sm'>
          <SelectValue placeholder='Select format' />
        </SelectTrigger>
        <SelectContent>
          {formats.map((f) => (
            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ParseHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: ParseHelperProps) {
  const [format, setFormat] = useState((node.params.format as string) ?? '');

  const handleDialogOpen = () => setFormat((node.params.format as string) ?? '');

  const handleApply = (ref: string) => {
    onUpdate({ params: { ...node.params, format }, ...(ref ? { ref } : {}) });
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
      tabs={[{ id: 'form', label: 'Parse', content: <ParseForm format={format} onFormatChange={setFormat} /> }]}
    />
  );
}
