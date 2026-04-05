'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Label } from './ui/label.tsx';
import { Textarea } from './ui/textarea.tsx';
import type { UINode } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface TooltipHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

export function TooltipHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: TooltipHelperProps) {
  const [content, setContent] = useState((node.params.content as string) ?? '');

  const handleDialogOpen = () => setContent((node.params.content as string) ?? '');

  const handleApply = (ref: string) => {
    onUpdate({ params: { ...node.params, content }, ...(ref ? { ref } : {}) });
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
        id: 'form', label: 'Tooltip',
        content: (
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>Content</Label>
            <Textarea
              className='text-sm min-h-[80px] resize-y'
              placeholder='Enter tooltip content'
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        ),
      }]}
    />
  );
}
