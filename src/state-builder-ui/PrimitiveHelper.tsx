'use client';

import { Button } from './ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog.tsx';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx';
import { BoxIcon, PlusIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PRIMITIVE_KINDS } from '@molstar/state-builder';
import type { PrimitiveKind } from '@molstar/state-builder';
import type { UINode } from '@molstar/state-builder';
import { PrimitiveItemEditor, RawPanel } from './primitive-helper/index.ts';

export interface PrimitiveHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

function kindLabel(kind: unknown): string {
  const found = PRIMITIVE_KINDS.find((k) => k.value === kind);
  return found?.label ?? String(kind ?? 'Unknown');
}

function defaultParamsForKind(kind: PrimitiveKind): Record<string, unknown> {
  switch (kind) {
    case 'label':
      return { kind, position: {}, text: 'Label' };
    case 'ellipsoid':
      return { kind, center: [0, 0, 0], major_axis: [1, 0, 0], minor_axis: [0, 1, 0] };
    case 'distance_measurement':
      return { kind, start: [0, 0, 0], end: [1, 0, 0] };
    case 'angle_measurement':
      return { kind, a: [0, 0, 0], b: [1, 0, 0], c: [2, 0, 0] };
    case 'arrow':
      return { kind, start: [0, 0, 0], end: [1, 0, 0] };
    case 'tube':
      return { kind, start: [0, 0, 0], end: [1, 0, 0] };
    case 'box':
      return { kind, center: [0, 0, 0], extent: [1, 1, 1] };
    case 'ellipse':
      return { kind, center: [0, 0, 0], major_axis: [1, 0, 0], minor_axis: [0, 1, 0] };
    case 'mesh':
      return { kind, vertices: [], indices: [] };
    case 'lines':
      return { kind, vertices: [], indices: [] };
    default:
      return { kind };
  }
}

function newNode(kind: PrimitiveKind = 'label'): UINode {
  return {
    id: `prim-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    kind: 'primitive',
    params: defaultParamsForKind(kind),
    children: [],
  };
}

export function PrimitiveHelper({ node, onUpdate, open: controlledOpen, onOpenChange, trigger }: PrimitiveHelperProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = isControlled ? controlledOpen! : uncontrolledOpen;
  const setIsOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setUncontrolledOpen(v);
  };

  const primitives = (node.children ?? []).filter((c) => c.kind === 'primitive');

  const [localPrimitives, setLocalPrimitives] = useState<UINode[]>([]);
  const [activeTab, setActiveTab] = useState<string>('raw');
  const [rawJson, setRawJson] = useState('[]');
  const [rawError, setRawError] = useState('');

  // Sync on open
  useEffect(() => {
    if (!isOpen) return;
    const nodes = primitives.map((p) => ({ ...p }));
    setLocalPrimitives(nodes);
    setActiveTab(nodes[0]?.id ?? 'raw');
    setRawJson(JSON.stringify(nodes.map((p) => ({ ...p.params })), null, 2));
    setRawError('');
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePrimitive = (id: string, newParams: Record<string, unknown>) => {
    setLocalPrimitives((prev) => prev.map((p) => (p.id === id ? { ...p, params: newParams } : p)));
  };

  const updateRef = (id: string, ref: string) => {
    setLocalPrimitives((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ref: ref || undefined } : p))
    );
  };

  const addPrimitive = () => {
    const n = newNode('label');
    setLocalPrimitives((prev) => [...prev, n]);
    setActiveTab(n.id);
  };

  const removePrimitive = (id: string) => {
    setLocalPrimitives((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (activeTab === id) {
        setActiveTab(next[0]?.id ?? 'raw');
      }
      return next;
    });
  };

  const movePrimitive = (id: string, dir: -1 | 1) => {
    setLocalPrimitives((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const handleApply = () => {
    if (activeTab === 'raw') {
      try {
        const arr = JSON.parse(rawJson) as Array<Record<string, unknown>>;
        if (!Array.isArray(arr)) { setRawError('Must be a JSON array'); return; }
        const nodes: UINode[] = arr.map((p) => ({
          id: `prim-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          kind: 'primitive' as const,
          params: p,
          children: [],
        }));
        onUpdate({ children: nodes });
        setIsOpen(false);
      } catch {
        setRawError('Invalid JSON');
      }
      return;
    }
    onUpdate({ children: localPrimitives });
    setIsOpen(false);
  };

  const count = primitives.length;
  const triggerLabel =
    count === 0 ? 'Add primitives...' : `${count} primitive${count > 1 ? 's' : ''}`;

  const defaultTrigger = (
    <Button variant='outline' size='sm' className='h-8' title='Edit primitive children'>
      <BoxIcon className='size-4 mr-1' />
      {triggerLabel}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? defaultTrigger}
      </DialogTrigger>

      <DialogContent className='sm:max-w-2xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Primitive Helper</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab list + Add button */}
          <div className='flex items-center gap-2'>
            <div className='flex-1 overflow-x-auto'>
              <TabsList className='flex flex-nowrap'>
                {localPrimitives.map((p) => (
                  <TabsTrigger key={p.id} value={p.id} className='shrink-0'>
                    {kindLabel(p.params.kind)}
                  </TabsTrigger>
                ))}
                <TabsTrigger value='raw' className='shrink-0'>
                  Raw
                </TabsTrigger>
              </TabsList>
            </div>
            <Button size='sm' variant='outline' onClick={addPrimitive} title='Add primitive'>
              <PlusIcon className='size-4' />
            </Button>
          </div>

          {/* Per-primitive editors */}
          {localPrimitives.map((p, idx) => (
            <TabsContent key={p.id} value={p.id} className='space-y-3 mt-3'>
              <PrimitiveItemEditor
                params={p.params}
                onUpdate={(newParams) => updatePrimitive(p.id, newParams)}
              />

              {/* Ref + move + delete row */}
              <div className='flex gap-2 mt-3 pt-3 border-t items-center'>
                <Label className='text-xs shrink-0'>Ref</Label>
                <Input
                  className='h-8 text-sm w-28'
                  placeholder='optional'
                  value={p.ref ?? ''}
                  onChange={(e) => updateRef(p.id, e.target.value)}
                />
                <div className='ml-auto flex gap-1'>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-7 w-7 p-0'
                    title='Move up'
                    disabled={idx === 0}
                    onClick={() => movePrimitive(p.id, -1)}
                  >
                    <ArrowUpIcon className='size-3' />
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-7 w-7 p-0'
                    title='Move down'
                    disabled={idx === localPrimitives.length - 1}
                    onClick={() => movePrimitive(p.id, 1)}
                  >
                    <ArrowDownIcon className='size-3' />
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-7 w-7 p-0 text-destructive hover:text-destructive'
                    title='Remove primitive'
                    onClick={() => removePrimitive(p.id)}
                  >
                    <Trash2Icon className='size-3' />
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}

          {/* Empty state */}
          {localPrimitives.length === 0 && activeTab !== 'raw' && (
            <div className='p-6 text-center text-sm text-muted-foreground border rounded-md mt-3'>
              No primitives yet. Click <strong>+</strong> to add one.
            </div>
          )}

          {/* Raw tab */}
          <TabsContent value='raw' className='mt-3'>
            <RawPanel
              value={rawJson}
              error={rawError}
              onChange={(v) => {
                setRawJson(v);
                setRawError('');
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className='flex gap-2 justify-end pt-2 border-t'>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply Primitives</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
