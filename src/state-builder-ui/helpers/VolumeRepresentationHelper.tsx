'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Label } from '../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select.tsx';
import { Switch } from '../base/switch.tsx';
import type { UINode } from '../../state-builder/index.ts';
import { VOLUME_REPRESENTATION_TYPES, getActiveValues } from '../../state-builder/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import { NumericInput } from '../components/NumericInput.tsx';

interface VolumeRepresentationHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

function initFromNode(node: UINode) {
  const p = node.params as Record<string, unknown>;
  return {
    type: (p.type as string) ?? '',
    relativeIsovalue: p.relative_isovalue as number | undefined,
    absoluteIsovalue: p.absolute_isovalue as number | undefined,
    showWireframe: (p.show_wireframe as boolean) ?? false,
    showFaces: p.show_faces !== undefined ? (p.show_faces as boolean) : true,
    dimension: (p.dimension as string) ?? 'x',
    absoluteIndex: p.absolute_index as number | undefined,
    relativeIndex: p.relative_index as number | undefined,
  };
}

export function VolumeRepresentationHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: VolumeRepresentationHelperProps) {
  const init = initFromNode(node);
  const [type, setType] = useState(init.type);
  const [relativeIsovalue, setRelativeIsovalue] = useState<number | undefined>(init.relativeIsovalue);
  const [absoluteIsovalue, setAbsoluteIsovalue] = useState<number | undefined>(init.absoluteIsovalue);
  const [showWireframe, setShowWireframe] = useState(init.showWireframe);
  const [showFaces, setShowFaces] = useState(init.showFaces);
  const [dimension, setDimension] = useState(init.dimension);
  const [absoluteIndex, setAbsoluteIndex] = useState<number | undefined>(init.absoluteIndex);
  const [relativeIndex, setRelativeIndex] = useState<number | undefined>(init.relativeIndex);

  const handleDialogOpen = () => {
    const s = initFromNode(node);
    setType(s.type);
    setRelativeIsovalue(s.relativeIsovalue);
    setAbsoluteIsovalue(s.absoluteIsovalue);
    setShowWireframe(s.showWireframe);
    setShowFaces(s.showFaces);
    setDimension(s.dimension);
    setAbsoluteIndex(s.absoluteIndex);
    setRelativeIndex(s.relativeIndex);
  };

  const handleApply = (ref: string) => {
    const params: Record<string, unknown> = { ...node.params, type };
    if (type === 'isosurface') {
      if (relativeIsovalue !== undefined) params.relative_isovalue = relativeIsovalue;
      else delete params.relative_isovalue;
      if (absoluteIsovalue !== undefined) params.absolute_isovalue = absoluteIsovalue;
      else delete params.absolute_isovalue;
      params.show_wireframe = showWireframe;
      params.show_faces = showFaces;
    } else if (type === 'grid_slice') {
      params.dimension = dimension;
      if (absoluteIndex !== undefined) params.absolute_index = absoluteIndex;
      else delete params.absolute_index;
      if (relativeIndex !== undefined) params.relative_index = relativeIndex;
      else delete params.relative_index;
      if (relativeIsovalue !== undefined) params.relative_isovalue = relativeIsovalue;
      else delete params.relative_isovalue;
      if (absoluteIsovalue !== undefined) params.absolute_isovalue = absoluteIsovalue;
      else delete params.absolute_isovalue;
    }
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  const handleRawApply = (params: Record<string, unknown>, ref: string) => {
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  const types = getActiveValues(VOLUME_REPRESENTATION_TYPES);

  return (
    <NodeHelperBase node={node} onApply={handleApply} onRawApply={handleRawApply} onDialogOpen={handleDialogOpen} open={open} onOpenChange={onOpenChange} trigger={trigger} onCustomChange={onCustomChange}
      tabs={[{
        id: 'form', label: 'Volume Representation',
        content: (
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger size='sm'><SelectValue placeholder='Select type' /></SelectTrigger>
                <SelectContent>{types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {type === 'isosurface' && (
              <>
                <div className='flex gap-3'>
                  <div className='flex flex-col gap-1 flex-1'>
                    <Label className='text-xs'>Relative isovalue <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                    <NumericInput className='h-7 text-xs font-mono' placeholder='e.g. 1.5' value={relativeIsovalue} onChange={setRelativeIsovalue} />
                  </div>
                  <div className='flex flex-col gap-1 flex-1'>
                    <Label className='text-xs'>Absolute isovalue <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                    <NumericInput className='h-7 text-xs font-mono' placeholder='optional' value={absoluteIsovalue} onChange={setAbsoluteIsovalue} />
                  </div>
                </div>
                <div className='flex gap-6'>
                  <div className='flex items-center gap-2'>
                    <Switch checked={showFaces} onCheckedChange={setShowFaces} />
                    <Label className='text-xs'>Show faces</Label>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Switch checked={showWireframe} onCheckedChange={setShowWireframe} />
                    <Label className='text-xs'>Show wireframe</Label>
                  </div>
                </div>
              </>
            )}

            {type === 'grid_slice' && (
              <>
                <div className='flex flex-col gap-1 w-28'>
                  <Label className='text-xs'>Dimension</Label>
                  <Select value={dimension} onValueChange={setDimension}>
                    <SelectTrigger size='sm'><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='x'>x</SelectItem>
                      <SelectItem value='y'>y</SelectItem>
                      <SelectItem value='z'>z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex gap-3'>
                  <div className='flex flex-col gap-1 flex-1'>
                    <Label className='text-xs'>Absolute index <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                    <NumericInput className='h-7 text-xs font-mono' placeholder='optional' value={absoluteIndex} onChange={setAbsoluteIndex} />
                  </div>
                  <div className='flex flex-col gap-1 flex-1'>
                    <Label className='text-xs'>Relative index <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                    <NumericInput className='h-7 text-xs font-mono' placeholder='0.0 – 1.0' value={relativeIndex} onChange={setRelativeIndex} />
                  </div>
                </div>
                <div className='flex gap-3'>
                  <div className='flex flex-col gap-1 flex-1'>
                    <Label className='text-xs'>Relative isovalue <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                    <NumericInput className='h-7 text-xs font-mono' placeholder='optional' value={relativeIsovalue} onChange={setRelativeIsovalue} />
                  </div>
                  <div className='flex flex-col gap-1 flex-1'>
                    <Label className='text-xs'>Absolute isovalue <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                    <NumericInput className='h-7 text-xs font-mono' placeholder='optional' value={absoluteIsovalue} onChange={setAbsoluteIsovalue} />
                  </div>
                </div>
              </>
            )}
          </div>
        ),
      }]}
    />
  );
}
