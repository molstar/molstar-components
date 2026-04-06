'use client';

import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import { PositionEditor } from './PositionEditor.tsx';
import { positionFromParam, positionToParam } from './types.ts';
import type { PrimitiveKindFieldsProps } from './types.ts';

export function AngleFields({ params, onUpdate }: PrimitiveKindFieldsProps) {
  const a = positionFromParam(params.a);
  const b = positionFromParam(params.b);
  const c = positionFromParam(params.c);

  return (
    <div className='space-y-3'>
      <PositionEditor
        label='Point A'
        state={a}
        onChange={(s) => onUpdate({ ...params, a: positionToParam(s) })}
      />
      <PositionEditor
        label='Point B (vertex)'
        state={b}
        onChange={(s) => onUpdate({ ...params, b: positionToParam(s) })}
      />
      <PositionEditor
        label='Point C'
        state={c}
        onChange={(s) => onUpdate({ ...params, c: positionToParam(s) })}
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
