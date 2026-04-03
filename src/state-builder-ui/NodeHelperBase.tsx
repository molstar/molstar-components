'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.tsx';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx';
import { Textarea } from './ui/textarea.tsx';
import type { UINode } from '@molstar/state-builder';
import { MVS_KIND_LABELS } from '@molstar/state-builder';
import { getColorForKind } from './node-categories.ts';

export interface HelperTab {
  id: string;
  label: string;
  content: ReactNode;
}

export interface NodeHelperBaseProps {
  node: UINode;
  tabs: HelperTab[];
  title?: string;
  defaultTab?: string;
  /** Called (with current ref) when Apply is clicked on any non-Raw tab. */
  onApply: (ref: string) => void;
  /** Called (with parsed params + current ref) when Apply is clicked on Raw tab. */
  onRawApply: (params: Record<string, unknown>, ref: string) => void;
  /** Fires whenever the dialog transitions from closed→open. Use to reinit tab state. */
  onDialogOpen?: () => void;
  // Controlled mode
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Uncontrolled mode: base manages open state
  trigger?: ReactNode;
}

export function NodeHelperBase({
  node,
  tabs,
  title,
  defaultTab,
  onApply,
  onRawApply,
  onDialogOpen,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: NodeHelperBaseProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const setIsOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setUncontrolledOpen(v);
  };

  const [localRef, setLocalRef] = useState(node.ref ?? '');
  const [rawJson, setRawJson] = useState('');
  const [rawError, setRawError] = useState('');
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? 'raw');

  const prevOpenRef = useRef(false);
  const onDialogOpenRef = useRef(onDialogOpen);
  useEffect(() => { onDialogOpenRef.current = onDialogOpen; });
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setLocalRef(node.ref ?? '');
      setRawJson(JSON.stringify(node.params, null, 2));
      setRawError('');
      setActiveTab(defaultTab ?? tabs[0]?.id ?? 'raw');
      onDialogOpenRef.current?.();
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, node.ref, node.params, defaultTab, tabs]);

  const allTabs: HelperTab[] = [
    ...tabs,
    {
      id: 'raw',
      label: 'Raw',
      content: (
        <div className='flex flex-col gap-2'>
          <Textarea
            className='font-mono text-xs min-h-[160px] resize-y'
            value={rawJson}
            onChange={(e) => { setRawJson(e.target.value); setRawError(''); }}
            spellCheck={false}
            placeholder='{"type": "model"}'
          />
          {rawError && <p className='text-xs text-destructive'>{rawError}</p>}
        </div>
      ),
    },
  ];

  const handleApply = () => {
    if (activeTab === 'raw') {
      try {
        const parsed = JSON.parse(rawJson) as Record<string, unknown>;
        onRawApply(parsed, localRef);
        setIsOpen(false);
      } catch {
        setRawError('Invalid JSON — fix before applying.');
      }
      return;
    }
    onApply(localRef);
    setIsOpen(false);
  };

  const kindLabel =
    title ??
    (node.kind
      ? (MVS_KIND_LABELS[node.kind as keyof typeof MVS_KIND_LABELS] ?? node.kind)
      : 'Node');
  const dotColor = getColorForKind(node.kind);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && (
        <span onClick={() => setIsOpen(true)} style={{ cursor: 'pointer', display: 'contents' }}>
          {trigger}
        </span>
      )}
      <DialogContent className='sm:max-w-lg gap-0 p-0 overflow-hidden'>
        <DialogHeader className='px-5 pt-5 pb-3'>
          <DialogTitle className='flex items-center gap-2 text-base'>
            <span
              className='inline-block rounded-full shrink-0'
              style={{ width: 10, height: 10, background: dotColor }}
            />
            {kindLabel}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='flex flex-col'>
          <TabsList className='w-full justify-start rounded-none border-b bg-transparent h-auto px-5 pb-0 gap-1'>
            {allTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2 text-xs'
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {allTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className='px-5 py-4 mt-0'>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>

        <div className='px-5 py-3 border-t bg-muted/30 flex items-center gap-3'>
          <Label className='text-xs text-muted-foreground shrink-0 w-6'>Ref</Label>
          <Input
            className='h-7 text-xs font-mono flex-1'
            placeholder='optional reference name'
            value={localRef}
            onChange={(e) => setLocalRef(e.target.value)}
          />
        </div>

        <DialogFooter className='px-5 py-3 border-t'>
          <Button variant='outline' size='sm' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button size='sm' onClick={handleApply}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
