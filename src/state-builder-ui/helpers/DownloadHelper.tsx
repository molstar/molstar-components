'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import type { UINode } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface DownloadHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

function DownloadForm({ url, onUrlChange }: { url: string; onUrlChange: (v: string) => void }) {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1'>
        <Label className='text-xs'>URL</Label>
        <Input
          className='text-sm font-mono'
          placeholder='https://files.rcsb.org/download/1tqn.bcif'
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export function DownloadHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: DownloadHelperProps) {
  const [url, setUrl] = useState((node.params.url as string) ?? '');

  const handleDialogOpen = () => {
    setUrl((node.params.url as string) ?? '');
  };

  const handleApply = (ref: string) => {
    onUpdate({ params: { ...node.params, url }, ...(ref ? { ref } : {}) });
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
      tabs={[{ id: 'form', label: 'Download', content: <DownloadForm url={url} onUrlChange={setUrl} /> }]}
    />
  );
}
