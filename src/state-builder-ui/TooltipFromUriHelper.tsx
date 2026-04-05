'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import type { UINode } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface TooltipFromUriHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

export function TooltipFromUriHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: TooltipFromUriHelperProps) {
  const [uri, setUri] = useState((node.params.uri as string) ?? '');

  const handleDialogOpen = () => setUri((node.params.uri as string) ?? '');

  const handleApply = (ref: string) => {
    onUpdate({ params: { ...node.params, uri }, ...(ref ? { ref } : {}) });
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
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>URI</Label>
            <Input
              className='text-sm font-mono'
              placeholder='https://...'
              value={uri}
              onChange={(e) => setUri(e.target.value)}
            />
          </div>
        ),
      }]}
    />
  );
}
