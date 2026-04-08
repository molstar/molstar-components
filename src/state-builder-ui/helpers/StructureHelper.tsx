'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import type { UINode } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface StructureHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

function parseIjk(v: unknown): [number, number, number] {
  if (Array.isArray(v) && v.length === 3) return v as [number, number, number];
  return [0, 0, 0];
}

function IjkInput({ label, value, onChange }: { label: string; value: [number, number, number]; onChange: (v: [number, number, number]) => void }) {
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      <div className='flex gap-1'>
        {(['i', 'j', 'k'] as const).map((axis, idx) => (
          <Input
            key={axis}
            className='h-7 text-xs font-mono w-14'
            type='number'
            step='1'
            placeholder={axis}
            value={value[idx]}
            onChange={(e) => {
              const next = [...value] as [number, number, number];
              next[idx] = parseInt(e.target.value) || 0;
              onChange(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SharedFields({
  modelIndex, blockIndex, blockHeader, coordinatesRef,
  onModelIndexChange, onBlockIndexChange, onBlockHeaderChange, onCoordinatesRefChange,
}: {
  modelIndex: number | undefined; blockIndex: number | undefined;
  blockHeader: string | undefined; coordinatesRef: string | undefined;
  onModelIndexChange: (v: number | undefined) => void;
  onBlockIndexChange: (v: number | undefined) => void;
  onBlockHeaderChange: (v: string | undefined) => void;
  onCoordinatesRefChange: (v: string | undefined) => void;
}) {
  return (
    <div className='flex flex-col gap-3 mt-3 pt-3 border-t'>
      <div className='flex gap-3 flex-wrap'>
        <div className='flex flex-col gap-1 w-24'>
          <Label className='text-xs'>Model index</Label>
          <Input className='h-7 text-xs font-mono' type='number' min='0' placeholder='0' value={modelIndex ?? ''} onChange={(e) => onModelIndexChange(e.target.value === '' ? undefined : parseInt(e.target.value))} />
        </div>
        <div className='flex flex-col gap-1 w-24'>
          <Label className='text-xs'>Block index</Label>
          <Input className='h-7 text-xs font-mono' type='number' min='0' placeholder='0' value={blockIndex ?? ''} onChange={(e) => onBlockIndexChange(e.target.value === '' ? undefined : parseInt(e.target.value))} />
        </div>
        <div className='flex flex-col gap-1 w-32'>
          <Label className='text-xs'>Block header</Label>
          <Input className='h-7 text-xs' placeholder='optional' value={blockHeader ?? ''} onChange={(e) => onBlockHeaderChange(e.target.value || undefined)} />
        </div>
        <div className='flex flex-col gap-1 w-28'>
          <Label className='text-xs'>Coords ref</Label>
          <Input className='h-7 text-xs font-mono' placeholder='optional' value={coordinatesRef ?? ''} onChange={(e) => onCoordinatesRefChange(e.target.value || undefined)} />
        </div>
      </div>
    </div>
  );
}

type StructureTab = 'model' | 'assembly' | 'symmetry' | 'symmetry_mates';

function initFromNode(node: UINode) {
  const p = node.params;
  const type = (p.type as string) || 'model';
  const tab: StructureTab = (['model', 'assembly', 'symmetry', 'symmetry_mates'] as StructureTab[]).includes(type as StructureTab)
    ? (type as StructureTab)
    : 'model';
  return {
    tab,
    assemblyId: (p.assembly_id as string) ?? '',
    radius: (p.radius as number) ?? 5,
    ijkMin: parseIjk(p.ijk_min),
    ijkMax: parseIjk(p.ijk_max),
    modelIndex: p.model_index as number | undefined,
    blockIndex: p.block_index as number | undefined,
    blockHeader: p.block_header as string | undefined,
    coordinatesRef: p.coordinates_ref as string | undefined,
  };
}

export function StructureHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: StructureHelperProps) {
  const init = initFromNode(node);
  const [activeTab, setActiveTab] = useState<StructureTab>(init.tab);
  const [assemblyId, setAssemblyId] = useState(init.assemblyId);
  const [radius, setRadius] = useState(init.radius);
  const [ijkMin, setIjkMin] = useState<[number, number, number]>(init.ijkMin);
  const [ijkMax, setIjkMax] = useState<[number, number, number]>(init.ijkMax);
  const [modelIndex, setModelIndex] = useState<number | undefined>(init.modelIndex);
  const [blockIndex, setBlockIndex] = useState<number | undefined>(init.blockIndex);
  const [blockHeader, setBlockHeader] = useState<string | undefined>(init.blockHeader);
  const [coordinatesRef, setCoordinatesRef] = useState<string | undefined>(init.coordinatesRef);

  const handleDialogOpen = () => {
    const s = initFromNode(node);
    setActiveTab(s.tab);
    setAssemblyId(s.assemblyId);
    setRadius(s.radius);
    setIjkMin(s.ijkMin);
    setIjkMax(s.ijkMax);
    setModelIndex(s.modelIndex);
    setBlockIndex(s.blockIndex);
    setBlockHeader(s.blockHeader);
    setCoordinatesRef(s.coordinatesRef);
  };

  const sharedProps = {
    modelIndex, blockIndex, blockHeader, coordinatesRef,
    onModelIndexChange: setModelIndex, onBlockIndexChange: setBlockIndex,
    onBlockHeaderChange: setBlockHeader, onCoordinatesRefChange: setCoordinatesRef,
  };

  const handleApply = (ref: string) => {
    const base: Record<string, unknown> = { type: activeTab };
    if (modelIndex !== undefined) base.model_index = modelIndex;
    if (blockIndex !== undefined) base.block_index = blockIndex;
    if (blockHeader) base.block_header = blockHeader;
    if (coordinatesRef) base.coordinates_ref = coordinatesRef;
    if (activeTab === 'assembly' && assemblyId) base.assembly_id = assemblyId;
    if (activeTab === 'symmetry_mates') base.radius = radius;
    if (activeTab === 'symmetry') { base.ijk_min = ijkMin; base.ijk_max = ijkMax; }
    onUpdate({ params: base, ...(ref ? { ref } : {}) });
  };

  const handleRawApply = (params: Record<string, unknown>, ref: string) => {
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  const tabs = [
    { id: 'model', label: 'Model', content: <SharedFields {...sharedProps} /> },
    {
      id: 'assembly', label: 'Assembly',
      content: (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-col gap-1 w-32'>
            <Label className='text-xs'>Assembly ID</Label>
            <Input className='h-7 text-sm' placeholder='1' value={assemblyId} onChange={(e) => setAssemblyId(e.target.value)} />
          </div>
          <SharedFields {...sharedProps} />
        </div>
      ),
    },
    {
      id: 'symmetry', label: 'Symmetry',
      content: (
        <div className='flex flex-col gap-3'>
          <div className='flex gap-4'>
            <IjkInput label='IJK Min' value={ijkMin} onChange={setIjkMin} />
            <IjkInput label='IJK Max' value={ijkMax} onChange={setIjkMax} />
          </div>
          <SharedFields {...sharedProps} />
        </div>
      ),
    },
    {
      id: 'symmetry_mates', label: 'Symmetry Mates',
      content: (
        <div className='flex flex-col gap-3'>
          <div className='flex flex-col gap-1 w-28'>
            <Label className='text-xs'>Radius (Å)</Label>
            <Input className='h-7 text-xs font-mono' type='number' min='0' step='1' placeholder='5' value={radius} onChange={(e) => setRadius(parseFloat(e.target.value) || 5)} />
          </div>
          <SharedFields {...sharedProps} />
        </div>
      ),
    },
  ];

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
      defaultTab={activeTab}
      onTabChange={(id) => setActiveTab(id as StructureTab)}
      tabs={tabs}
    />
  );
}
