'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import type { UINode } from '../../state-builder/index.ts';
import type { ComponentSelectorValue } from '../../state-builder/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import { SelectorHelperContent, type SelectorTab } from './SelectorHelperContent.tsx';
import { useAnnotationSourceState } from './annotation-source-state.ts';

interface ComponentFromSourceHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

export function ComponentFromSourceHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: ComponentFromSourceHelperProps) {
  const source = useAnnotationSourceState(node);
  const [selector, setSelector] = useState<ComponentSelectorValue | undefined>((node.params.selector as ComponentSelectorValue | undefined) ?? 'all');
  const [selectorTab, setSelectorTab] = useState<SelectorTab>('quick');

  const handleDialogOpen = () => {
    source.reset();
    setSelector((node.params.selector as ComponentSelectorValue | undefined) ?? 'all');
  };

  const handleApply = (ref: string) => {
    const params = source.applyParams(node.params);
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
      onCustomChange={onCustomChange}
      tabs={[
        {
          id: 'form', label: 'Component from Source',
          content: (
            <div className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Category name</Label>
                <Input className='h-7 text-xs font-mono' placeholder='_struct' value={source.categoryName} onChange={(e) => source.setCategoryName(e.target.value)} />
              </div>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Field name</Label>
                <Input className='h-7 text-xs font-mono' placeholder='field' value={source.fieldName} onChange={(e) => source.setFieldName(e.target.value)} />
              </div>
              <div className='flex flex-col gap-1 w-28'>
                <Label className='text-xs'>Block index</Label>
                <Input className='h-7 text-xs font-mono' type='number' min='0' placeholder='optional' value={source.blockIndex ?? ''} onChange={(e) => source.setBlockIndex(e.target.value === '' ? undefined : parseInt(e.target.value))} />
              </div>
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
              hideMetadataStatus
            />
          ),
        },
      ]}
    />
  );
}
