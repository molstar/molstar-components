'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import type { UINode } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface LabelHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}

export function LabelHelper({ node, onUpdate, open, onOpenChange, trigger }: LabelHelperProps) {
  const [text, setText] = useState((node.params.text as string) ?? '');

  const handleDialogOpen = () => setText((node.params.text as string) ?? '');

  const handleApply = (ref: string) => {
    onUpdate({ params: { ...node.params, text }, ...(ref ? { ref } : {}) });
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
      tabs={[{
        id: 'form', label: 'Label',
        content: (
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>Text</Label>
            <Input
              className='text-sm'
              placeholder='Enter label text'
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        ),
      }]}
    />
  );
}
