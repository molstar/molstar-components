'use client';

import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import { PositionEditor } from './PositionEditor.tsx';
import { positionFromParam, positionToParam } from './types.ts';
import type { PrimitiveKindFieldsProps } from './types.ts';

export function ArrowFields({ params, onUpdate }: PrimitiveKindFieldsProps) {
  const start = positionFromParam(params.start);
  const end = positionFromParam(params.end);

  const handleCheck = (key: string, checked: boolean) => {
    onUpdate({ ...params, [key]: checked });
  };

  return (
    <div className='space-y-3'>
      <PositionEditor
        label='Start'
        state={start}
        onChange={(s) => onUpdate({ ...params, start: positionToParam(s) })}
      />
      <PositionEditor
        label='End'
        state={end}
        onChange={(s) => onUpdate({ ...params, end: positionToParam(s) })}
      />

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
          <Label className='text-xs font-medium'>Tube Radius</Label>
          <Input
            className='h-8 text-sm font-mono mt-1'
            type='number'
            step='0.01'
            min='0'
            placeholder='auto'
            value={typeof params.tube_radius === 'number' ? params.tube_radius : ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
              const next = { ...params };
              if (v === undefined) delete next.tube_radius;
              else next.tube_radius = v;
              onUpdate(next);
            }}
          />
        </div>
      </div>

      <div className='flex items-center gap-6'>
        <label className='flex items-center gap-2 text-xs cursor-pointer'>
          <input
            type='checkbox'
            checked={params.show_end_cap !== false}
            onChange={(e) => handleCheck('show_end_cap', e.target.checked)}
          />
          Show end cap
        </label>
        <label className='flex items-center gap-2 text-xs cursor-pointer'>
          <input
            type='checkbox'
            checked={params.show_start_cap === true}
            onChange={(e) => handleCheck('show_start_cap', e.target.checked)}
          />
          Show start cap
        </label>
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
