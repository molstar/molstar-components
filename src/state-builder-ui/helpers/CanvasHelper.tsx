'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import type { UINode } from '../../state-builder/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface CanvasHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

export function CanvasHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: CanvasHelperProps) {
  const initColor = (node.params.background_color as string) ?? '#ffffff';
  const [colorHex, setColorHex] = useState(initColor);

  const handleDialogOpen = () => {
    setColorHex((node.params.background_color as string) ?? '#ffffff');
  };

  const handleApply = (ref: string) => {
    onUpdate({ params: { ...node.params, background_color: colorHex }, ...(ref ? { ref } : {}) });
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
        id: 'form', label: 'Canvas',
        content: (
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Background Color</Label>
              <div className='flex gap-2 items-center'>
                <input
                  type='color'
                  className='h-8 w-10 cursor-pointer rounded border'
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                />
                <Input
                  className='h-7 text-xs font-mono w-28'
                  placeholder='#ffffff'
                  value={colorHex}
                  onChange={(e) => {
                    const v = e.target.value;
                    setColorHex(v);
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
