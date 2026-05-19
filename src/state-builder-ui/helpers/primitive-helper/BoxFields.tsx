'use client';

import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { PositionEditor } from './PositionEditor.tsx';
import { positionFromParam, positionToParam } from './types.ts';
import type { PrimitiveKindFieldsProps } from './types.ts';

export function BoxFields({ params, onUpdate }: PrimitiveKindFieldsProps) {
  const center = positionFromParam(params.center);

  const getVec3 = (key: string): [number, number, number] => {
    const v = params[key];
    if (Array.isArray(v) && v.length === 3) return v as [number, number, number];
    return [1, 1, 1];
  };

  const handleExtent = (axis: 0 | 1 | 2, v: number | undefined) => {
    const next = [...getVec3('extent')] as [number, number, number];
    next[axis] = v ?? next[axis];
    onUpdate({ ...params, extent: next });
  };

  return (
    <div className='space-y-3'>
      <PositionEditor
        label='Center'
        state={center}
        onChange={(s) => onUpdate({ ...params, center: positionToParam(s) })}
      />

      <div>
        <Label className='text-xs font-medium mb-1 block'>Extent (half-sizes)</Label>
        <div className='grid grid-cols-3 gap-2'>
          {(['X', 'Y', 'Z'] as const).map((ax, i) => (
            <div key={ax}>
              <Label className='text-xs text-muted-foreground'>{ax}</Label>
              <NumericInput
                className='h-8 text-sm font-mono'
                value={getVec3('extent')[i]}
                onChange={(v) => handleExtent(i as 0 | 1 | 2, v)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className='flex items-center gap-6'>
        <label className='flex items-center gap-2 text-xs cursor-pointer'>
          <input
            type='checkbox'
            checked={params.show_faces !== false}
            onChange={(e) => onUpdate({ ...params, show_faces: e.target.checked })}
          />
          Show faces
        </label>
        <label className='flex items-center gap-2 text-xs cursor-pointer'>
          <input
            type='checkbox'
            checked={params.show_edges !== false}
            onChange={(e) => onUpdate({ ...params, show_edges: e.target.checked })}
          />
          Show edges
        </label>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <Label className='text-xs font-medium'>Color</Label>
          <Input
            className='h-8 text-sm mt-1'
            placeholder='#ffffff or name'
            value={typeof params.color === 'string' ? params.color : ''}
            onChange={(e) => onUpdate({ ...params, color: e.target.value || undefined })}
          />
        </div>
        <div>
          <Label className='text-xs font-medium'>Edge Radius</Label>
          <Input
            className='h-8 text-sm font-mono mt-1'
            type='number'
            step='0.01'
            min='0'
            placeholder='auto'
            value={typeof params.edge_radius === 'number' ? params.edge_radius : ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
              const next = { ...params };
              if (v === undefined) delete next.edge_radius;
              else next.edge_radius = v;
              onUpdate(next);
            }}
          />
        </div>
      </div>

      <div>
        <Label className='text-xs font-medium'>Tooltip</Label>
        <Input
          className='h-8 text-sm mt-1'
          placeholder='Hover tooltip (optional)'
          value={typeof params.tooltip === 'string' ? params.tooltip : ''}
          onChange={(e) => onUpdate({ ...params, tooltip: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
