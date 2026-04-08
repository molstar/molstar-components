'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../base/dialog.tsx';
import { Button } from '../base/button.tsx';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../base/tabs.tsx';
import { Textarea } from '../base/textarea.tsx';
import type { UINode } from '@molstar/state-builder';
import { MVS_KIND_LABELS } from '@molstar/state-builder';
import { getColorForKind } from '../node-categories.ts';
import { ChevronRightIcon } from 'lucide-react';
import { cn } from '../lib/utils.ts';
import { useAfterApply } from '../state/after-apply-context.ts';

export interface HelperTab {
  id: string;
  label: string;
  content: ReactNode;
  /** When true, the tab trigger is hidden from TabsList but content is still rendered. */
  hidden?: boolean;
}

export interface NodeHelperBaseProps {
  node: UINode;
  tabs: HelperTab[];
  title?: string;
  defaultTab?: string;
  /** Called (with current ref) when Apply is clicked on any non-Raw tab. */
  onApply: (ref: string) => void;
  /** Called (with parsed params + current ref) when Apply is clicked on Raw tab. */
  onRawApply?: (params: Record<string, unknown>, ref: string) => void;
  /** Fires whenever the dialog transitions from closed→open. Use to reinit tab state. */
  onDialogOpen?: () => void;
  /** Live callback — called on every valid JSON keystroke. Pass undefined to clear. */
  onCustomChange?: (custom: unknown) => void;
  /** When true, the built-in "Raw" tab (which edits node.params) is suppressed. */
  suppressRawTab?: boolean;
  /** When true, the Apply button is disabled. */
  applyDisabled?: boolean;
  /** Fires when the active tab changes. */
  onTabChange?: (tabId: string) => void;
  /** Extra actions rendered in the dialog header next to the title. */
  headerActions?: ReactNode;
  /** Extra actions rendered at the trailing end of the TabsList row (e.g. Add button). */
  tabActions?: ReactNode;
  /** Override the DialogContent width/max-width class. Defaults to 'sm:max-w-lg'. */
  dialogContentClassName?: string;
  /** When provided, programmatically syncs the active tab. Changes trigger an internal setActiveTab call. */
  syncTab?: string;
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
  onCustomChange,
  suppressRawTab,
  applyDisabled,
  onTabChange,
  headerActions,
  tabActions,
  dialogContentClassName,
  syncTab,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: NodeHelperBaseProps) {
  const afterApply = useAfterApply();
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
  const [localCustomInput, setLocalCustomInput] = useState('');
  const [customExpanded, setCustomExpanded] = useState(false);
  const [customError, setCustomError] = useState('');

  const prevOpenRef = useRef(false);
  const onDialogOpenRef = useRef(onDialogOpen);
  useEffect(() => { onDialogOpenRef.current = onDialogOpen; });
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setLocalRef(node.ref ?? '');
      setRawJson(JSON.stringify(node.params, null, 2));
      setRawError('');
      setActiveTab(syncTab ?? defaultTab ?? tabs[0]?.id ?? 'raw');
      setLocalCustomInput(node.custom != null ? JSON.stringify(node.custom, null, 2) : '');
      setCustomExpanded(false);
      setCustomError('');
      onDialogOpenRef.current?.();
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, node.ref, node.params, node.custom, defaultTab, tabs]);

  useEffect(() => {
    if (syncTab !== undefined) setActiveTab(syncTab);
  }, [syncTab]);

  const allTabs: HelperTab[] = suppressRawTab
    ? tabs
    : [
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

  const handleCustomInputChange = (v: string) => {
    setLocalCustomInput(v);
    if (!v.trim()) { setCustomError(''); onCustomChange?.(undefined); return; }
    try {
      const parsed = JSON.parse(v) as unknown;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setCustomError('Must be a JSON object (e.g. { "key": "value" })');
        return;
      }
      setCustomError('');
      onCustomChange?.(parsed);
    } catch {
      setCustomError('Invalid JSON');
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const handleApply = () => {
    if (!suppressRawTab && activeTab === 'raw') {
      try {
        const parsed = JSON.parse(rawJson) as Record<string, unknown>;
        onRawApply?.(parsed, localRef);
        setIsOpen(false);
        afterApply?.();
      } catch {
        setRawError('Invalid JSON — fix before applying.');
      }
      return;
    }
    onApply(localRef);
    setIsOpen(false);
    afterApply?.();
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
      <DialogContent className={cn('gap-0 p-0 overflow-hidden flex flex-col max-h-[85vh]', dialogContentClassName ?? 'sm:max-w-lg')}>
        <DialogHeader className='px-5 pt-5 pb-3'>
          <DialogTitle className='flex items-center gap-2 text-base'>
            <span
              className='inline-block rounded-full shrink-0'
              style={{ width: 10, height: 10, background: dotColor }}
            />
            {kindLabel}
            {headerActions && <div className='ml-auto'>{headerActions}</div>}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className='flex flex-col flex-1 min-h-0' activationMode='manual'>
          <TabsList className='w-full justify-start rounded-none border-b bg-transparent h-auto px-5 pb-0 gap-1'>
            {allTabs.filter((tab) => !tab.hidden).map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2 text-xs'
              >
                {tab.label}
              </TabsTrigger>
            ))}
            {tabActions && <div className='ml-auto flex items-center pb-1'>{tabActions}</div>}
          </TabsList>
          {allTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className='px-5 py-4 mt-0 overflow-y-auto'>
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

        {onCustomChange && (
          <div className='px-5 py-2 border-t'>
            <button
              type='button'
              className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
              onClick={() => setCustomExpanded((o) => !o)}
            >
              <ChevronRightIcon className={cn('size-3 transition-transform', customExpanded && 'rotate-90')} />
              Custom data
              {node.custom != null && <span className='ml-1 size-1.5 rounded-full bg-primary inline-block' />}
            </button>
            {customExpanded && (
              <div className='mt-1'>
                <Textarea
                  className='text-xs font-mono min-h-[80px] resize-y'
                  placeholder='{ "key": "value" }'
                  value={localCustomInput}
                  onChange={(e) => handleCustomInputChange(e.target.value)}
                  spellCheck={false}
                />
                {customError && <p className='text-xs text-destructive mt-1'>{customError}</p>}
              </div>
            )}
          </div>
        )}

        <DialogFooter className='px-5 py-3 border-t'>
          <Button variant='outline' size='sm' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button size='sm' onClick={handleApply} disabled={applyDisabled}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
