'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import type { UINode } from '@molstar/state-builder';
import type { ComponentSelectorValue } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import { SelectorHelperContent, type SelectorTab } from './SelectorHelperContent.tsx';

interface ComponentFromUriHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}

export function ComponentFromUriHelper({ node, onUpdate, open, onOpenChange, trigger }: ComponentFromUriHelperProps) {
  const [uri, setUri] = useState((node.params.uri as string) ?? '');
  const [selector, setSelector] = useState<ComponentSelectorValue | undefined>(node.params.selector as ComponentSelectorValue | undefined);
  const [selectorTab, setSelectorTab] = useState<SelectorTab>('chain');

  const handleDialogOpen = () => {
    setUri((node.params.uri as string) ?? '');
    setSelector(node.params.selector as ComponentSelectorValue | undefined);
  };

  const handleApply = (ref: string) => {
    const params: Record<string, unknown> = { ...node.params, uri };
    if (selector !== undefined) params.selector = selector;
    else delete params.selector;
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
      tabs={[
        {
          id: 'form', label: 'Component from URI',
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
        },
        {
          id: 'selector', label: 'Selector',
          content: (
            <SelectorHelperContent
              value={selector}
              onChange={setSelector}
              activeTab={selectorTab}
              onTabChange={setSelectorTab}
            />
          ),
        },
      ]}
    />
  );
}
