'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select.tsx';
import type { UINode } from '@molstar/state-builder';
import { INTERPOLATION_KINDS, EASING_OPTIONS, getActiveValues } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface InterpolateHelperProps {
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
    targetRef: (p.target_ref as string) ?? '',
    property: (p.property as string) ?? '',
    kind: (p.kind as string) ?? '',
    easing: (p.easing as string) ?? '',
    durationMs: (p.duration_ms as number) ?? 1000,
  };
}

export function InterpolateHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: InterpolateHelperProps) {
  const init = initFromNode(node);
  const [targetRef, setTargetRef] = useState(init.targetRef);
  const [property, setProperty] = useState(init.property);
  const [kind, setKind] = useState(init.kind);
  const [easing, setEasing] = useState(init.easing);
  const [durationMs, setDurationMs] = useState(init.durationMs);

  const handleDialogOpen = () => {
    const s = initFromNode(node);
    setTargetRef(s.targetRef);
    setProperty(s.property);
    setKind(s.kind);
    setEasing(s.easing);
    setDurationMs(s.durationMs);
  };

  const handleApply = (ref: string) => {
    const params: Record<string, unknown> = {
      ...node.params,
      target_ref: targetRef,
      property,
      kind,
      easing,
      duration_ms: durationMs,
    };
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  const handleRawApply = (params: Record<string, unknown>, ref: string) => {
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  const kinds = getActiveValues(INTERPOLATION_KINDS);
  const easings = getActiveValues(EASING_OPTIONS);

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
        id: 'form', label: 'Interpolate',
        content: (
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Target ref</Label>
              <Input
                className='h-7 text-xs font-mono'
                placeholder='node reference'
                value={targetRef}
                onChange={(e) => setTargetRef(e.target.value)}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Property</Label>
              <Input
                className='h-7 text-xs'
                placeholder='property name'
                value={property}
                onChange={(e) => setProperty(e.target.value)}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Kind</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger size='sm'><SelectValue placeholder='Select kind' /></SelectTrigger>
                <SelectContent>{kinds.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Easing</Label>
              <Select value={easing} onValueChange={setEasing}>
                <SelectTrigger size='sm'><SelectValue placeholder='Select easing' /></SelectTrigger>
                <SelectContent>{easings.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-1 w-36'>
              <Label className='text-xs'>Duration (ms)</Label>
              <Input
                className='h-7 text-xs font-mono'
                type='number'
                min='0'
                step='100'
                placeholder='1000'
                value={durationMs}
                onChange={(e) => setDurationMs(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        ),
      }]}
    />
  );
}
