'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import type { UINode } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface OpacityHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}

export function OpacityHelper({ node, onUpdate, open, onOpenChange, trigger }: OpacityHelperProps) {
  const [opacity, setOpacity] = useState((node.params.opacity as number) ?? 1);

  const handleDialogOpen = () => setOpacity((node.params.opacity as number) ?? 1);

  const handleApply = (ref: string) => {
    onUpdate({ params: { ...node.params, opacity }, ...(ref ? { ref } : {}) });
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
        id: 'form', label: 'Opacity',
        content: (
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Opacity (0–1)</Label>
              <div className='flex gap-2 items-center'>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.01'
                  className='flex-1'
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                />
                <Input
                  className='h-7 text-xs font-mono w-16'
                  type='number'
                  min='0'
                  max='1'
                  step='0.01'
                  value={opacity}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) setOpacity(Math.min(1, Math.max(0, v)));
                  }}
                />
              </div>
            </div>
          </div>
        ),
      }]}
    />
  );
}
