'use client';

import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import { PositionEditor } from './PositionEditor.tsx';
import { positionFromParam, positionToParam } from './types.ts';
import type { PrimitiveKindFieldsProps } from './types.ts';

export function DistanceFields({ params, onUpdate }: PrimitiveKindFieldsProps) {
  const start = positionFromParam(params.start);
  const end = positionFromParam(params.end);

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
          <Label className='text-xs font-medium'>Radius</Label>
          <Input
            className='h-8 text-sm font-mono mt-1'
            type='number'
            step='0.01'
            min='0'
            placeholder='auto'
            value={typeof params.radius === 'number' ? params.radius : ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
              const next = { ...params };
              if (v === undefined) delete next.radius;
              else next.radius = v;
              onUpdate(next);
            }}
          />
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <Label className='text-xs font-medium'>Label Size</Label>
          <Input
            className='h-8 text-sm font-mono mt-1'
            type='number'
            step='0.5'
            min='0'
            placeholder='auto'
            value={typeof params.label_size === 'number' ? params.label_size : ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
              const next = { ...params };
              if (v === undefined) delete next.label_size;
              else next.label_size = v;
              onUpdate(next);
            }}
          />
        </div>
        <div>
          <Label className='text-xs font-medium'>Dash Length</Label>
          <Input
            className='h-8 text-sm font-mono mt-1'
            type='number'
            step='0.1'
            min='0'
            placeholder='auto'
            value={typeof params.dash_length === 'number' ? params.dash_length : ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
              const next = { ...params };
              if (v === undefined) delete next.dash_length;
              else next.dash_length = v;
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
