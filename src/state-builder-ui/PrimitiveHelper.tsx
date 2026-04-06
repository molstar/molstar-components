'use client';

import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import { BoxIcon, PlusIcon, Trash2Icon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { useState } from 'react';
import { PRIMITIVE_KINDS } from '@molstar/state-builder';
import type { PrimitiveKind } from '@molstar/state-builder';
import type { UINode } from '@molstar/state-builder';
import { PrimitiveItemEditor, RawPanel } from './primitive-helper/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import type { HelperTab } from './NodeHelperBase.tsx';

export interface PrimitiveHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

function kindLabel(kind: unknown): string {
  const found = PRIMITIVE_KINDS.find((k) => k.value === kind);
  return found?.label ?? String(kind ?? 'Unknown');
}

function defaultParamsForKind(kind: PrimitiveKind): Record<string, unknown> {
  switch (kind) {
    case 'label':
      return { kind, position: [0, 0, 0], text: 'Label' };
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

export function PrimitiveHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: PrimitiveHelperProps) {
  const primitives = (node.children ?? []).filter((c) => c.kind === 'primitive');

  const [localPrimitives, setLocalPrimitives] = useState<UINode[]>([]);
  const [activeTab, setActiveTab] = useState<string>('prim-empty');
  const [rawJson, setRawJson] = useState('[]');
  const [rawError, setRawError] = useState('');

  const handleCustomChange = onCustomChange ?? ((custom: unknown) => {
    onUpdate({ custom: custom as Record<string, unknown> | undefined });
  });

  const handleDialogOpen = () => {
    const nodes = primitives.map((p) => ({ ...p }));
    setLocalPrimitives(nodes);
    setActiveTab(nodes[0]?.id ?? 'prim-empty');
    setRawJson(JSON.stringify(nodes.map((p) => ({ ...p.params })), null, 2));
    setRawError('');
  };

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
        setActiveTab(next[0]?.id ?? 'prim-empty');
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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'prim-raw') {
      setRawJson(JSON.stringify(localPrimitives.map((p) => ({ ...p.params })), null, 2));
      setRawError('');
    }
  };

  const handleApply = (ref: string) => {
    const nonPrimChildren = (node.children ?? []).filter((c) => c.kind !== 'primitive');
    if (activeTab === 'prim-raw') {
      try {
        const arr = JSON.parse(rawJson) as Array<Record<string, unknown>>;
        if (!Array.isArray(arr)) { setRawError('Must be a JSON array'); return; }
        const nodes: UINode[] = arr.map((p) => ({
          id: `prim-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          kind: 'primitive' as const,
          params: p,
          children: [],
        }));
        onUpdate({ children: [...nonPrimChildren, ...nodes], ref: ref || undefined });
      } catch {
        setRawError('Invalid JSON');
      }
      return;
    }
    onUpdate({ children: [...nonPrimChildren, ...localPrimitives], ref: ref || undefined });
  };

  const activeIdx = localPrimitives.findIndex((p) => p.id === activeTab);
  const isActivePrimTab = activeIdx >= 0;

  const tabActions = (
    <div className='flex items-center gap-0.5'>
      {isActivePrimTab && (
        <>
          <Button
            size='sm'
            variant='ghost'
            className='h-6 w-6 p-0'
            title='Move left'
            disabled={activeIdx === 0}
            onClick={() => movePrimitive(localPrimitives[activeIdx].id, -1)}
          >
            <ArrowLeftIcon className='size-3' />
          </Button>
          <Button
            size='sm'
            variant='ghost'
            className='h-6 w-6 p-0'
            title='Move right'
            disabled={activeIdx === localPrimitives.length - 1}
            onClick={() => movePrimitive(localPrimitives[activeIdx].id, 1)}
          >
            <ArrowRightIcon className='size-3' />
          </Button>
          <Button
            size='sm'
            variant='ghost'
            className='h-6 w-6 p-0 text-destructive hover:text-destructive'
            title='Remove primitive'
            onClick={() => removePrimitive(localPrimitives[activeIdx].id)}
          >
            <Trash2Icon className='size-3' />
          </Button>
          <span className='w-px h-4 bg-border mx-0.5 inline-block' />
        </>
      )}
      <Button
        size='sm'
        variant='outline'
        className='h-6 px-2 text-xs'
        title='Add primitive'
        onClick={addPrimitive}
      >
        <PlusIcon className='size-3 mr-1' />
        Add
      </Button>
    </div>
  );

  const count = primitives.length;
  const triggerLabel =
    count === 0 ? 'Add primitives...' : `${count} primitive${count > 1 ? 's' : ''}`;

  const defaultTrigger = (
    <Button variant='outline' size='sm' className='h-8' title='Edit primitive children'>
      <BoxIcon className='size-4 mr-1' />
      {triggerLabel}
    </Button>
  );

  const tabs: HelperTab[] = [
    {
      id: 'prim-empty',
      label: '',
      hidden: true,
      content: (
        <div className='flex flex-col items-center justify-center py-10 gap-3 text-center'>
          <BoxIcon className='size-8 text-muted-foreground' />
          <div>
            <p className='text-sm font-medium'>No primitives yet</p>
            <p className='text-xs text-muted-foreground mt-1'>Add shapes, labels, or measurements to this node.</p>
          </div>
          <Button size='sm' variant='outline' onClick={addPrimitive}>
            <PlusIcon className='size-3 mr-1' />
            Add primitive
          </Button>
        </div>
      ),
    },
    ...localPrimitives.map((p) => ({
      id: p.id,
      label: kindLabel(p.params.kind),
      content: (
        <div className='space-y-3'>
          <PrimitiveItemEditor
            params={p.params}
            onUpdate={(newParams) => updatePrimitive(p.id, newParams)}
          />
          <div className='flex gap-2 mt-3 pt-3 border-t items-center'>
            <Label className='text-xs shrink-0'>Identifier</Label>
            <Input
              className='h-8 text-sm w-28'
              placeholder='optional'
              value={p.ref ?? ''}
              onChange={(e) => updateRef(p.id, e.target.value)}
            />
          </div>
        </div>
      ),
    })),
    {
      id: 'prim-raw',
      label: 'Raw',
      content: (
        <RawPanel
          value={rawJson}
          error={rawError}
          onChange={(v) => {
            setRawJson(v);
            if (!v.trim()) { setRawError(''); return; }
            try {
              const parsed = JSON.parse(v) as unknown;
              setRawError(Array.isArray(parsed) ? '' : 'Must be a JSON array');
            } catch {
              setRawError('Invalid JSON');
            }
          }}
        />
      ),
    },
  ];

  return (
    <NodeHelperBase
      node={node}
      tabs={tabs}
      title='Primitive Helper'
      suppressRawTab
      applyDisabled={activeTab === 'prim-raw' && !!rawError}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger !== undefined ? trigger : (open !== undefined ? null : defaultTrigger)}
      onDialogOpen={handleDialogOpen}
      syncTab={activeTab}
      onTabChange={handleTabChange}
      onApply={handleApply}
      onCustomChange={handleCustomChange}
      tabActions={tabActions}
      dialogContentClassName='sm:max-w-2xl'
    />
  );
}
