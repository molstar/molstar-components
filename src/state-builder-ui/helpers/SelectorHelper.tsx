'use client';

import { useState } from 'react';
import type { ComponentSelectorValue, StructureMetadata, UINode } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import { SelectorHelperContent, type SelectorTab } from './SelectorHelperContent.tsx';

export interface SelectorHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  metadata?: StructureMetadata;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

export function SelectorHelper({
  node,
  onUpdate,
  metadata,
  open,
  onOpenChange,
  trigger,
  onCustomChange,
}: SelectorHelperProps) {
  const [selectorValue, setSelectorValue] = useState<ComponentSelectorValue | undefined>(
    node.params.selector as ComponentSelectorValue | undefined
  );
  const [activeTab, setActiveTab] = useState<SelectorTab>('chain');

  const handleDialogOpen = () => {
    setSelectorValue(node.params.selector as ComponentSelectorValue | undefined);
  };

  const handleApply = (ref: string) => {
    onUpdate({ params: { ...node.params, selector: selectorValue }, ...(ref ? { ref } : {}) });
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
          id: 'selector',
          label: 'Selector',
          content: (
            <SelectorHelperContent
              value={selectorValue}
              onChange={setSelectorValue}
              metadata={metadata}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          ),
        },
      ]}
    />
  );
}
