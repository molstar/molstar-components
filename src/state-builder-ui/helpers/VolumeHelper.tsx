'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import type { UINode } from '../../state-builder/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface VolumeHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

function initFromNode(node: UINode) {
  const p = node.params;
  return {
    sourceId: (p.channel_id as string) ?? '',
    blockIndex: p.block_index as number | undefined,
    blockHeader: (p.block_header as string) ?? '',
  };
}

export function VolumeHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: VolumeHelperProps) {
  const init = initFromNode(node);
  const [sourceId, setSourceId] = useState(init.sourceId);
  const [blockIndex, setBlockIndex] = useState<number | undefined>(init.blockIndex);
  const [blockHeader, setBlockHeader] = useState(init.blockHeader);

  const handleDialogOpen = () => {
    const s = initFromNode(node);
    setSourceId(s.sourceId);
    setBlockIndex(s.blockIndex);
    setBlockHeader(s.blockHeader);
  };

  const handleApply = (ref: string) => {
    const params: Record<string, unknown> = { ...node.params, channel_id: sourceId };
    if (blockIndex !== undefined) params.block_index = blockIndex;
    else delete params.block_index;
    if (blockHeader) params.block_header = blockHeader;
    else delete params.block_header;
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
        id: 'form', label: 'Volume',
        content: (
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Channel ID</Label>
              <Input
                className='text-sm font-mono'
                placeholder='source identifier'
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              />
            </div>
            <div className='flex gap-3'>
              <div className='flex flex-col gap-1 w-28'>
                <Label className='text-xs'>Block index</Label>
                <Input
                  className='h-7 text-xs font-mono'
                  type='number'
                  min='0'
                  placeholder='optional'
                  value={blockIndex ?? ''}
                  onChange={(e) => setBlockIndex(e.target.value === '' ? undefined : parseInt(e.target.value))}
                />
              </div>
              <div className='flex flex-col gap-1 flex-1'>
                <Label className='text-xs'>Block header</Label>
                <Input
                  className='h-7 text-xs font-mono'
                  placeholder='optional'
                  value={blockHeader}
                  onChange={(e) => setBlockHeader(e.target.value)}
                />
              </div>
            </div>
          </div>
        ),
      }]}
    />
  );
}
