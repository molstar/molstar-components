'use client';

import { Input } from '../ui/input.tsx';
import { Label } from '../ui/label.tsx';
import { PositionEditor } from './PositionEditor.tsx';
import { positionFromParam, positionToParam, defaultPositionState } from './types.ts';
import type { PrimitiveKindFieldsProps } from './types.ts';

export function EllipsoidFields({ params, onUpdate }: PrimitiveKindFieldsProps) {
  const center = positionFromParam(params.center);

  const getVec3 = (key: string): [number, number, number] => {
    const v = params[key];
    if (Array.isArray(v) && v.length === 3) return v as [number, number, number];
    return [0, 0, 0];
  };

  const handleVec3 = (key: string, axis: 0 | 1 | 2, str: string) => {
    const next = [...getVec3(key)] as [number, number, number];
    next[axis] = parseFloat(str) || 0;
    onUpdate({ ...params, [key]: next });
  };

  return (
    <div className='space-y-3'>
      <PositionEditor
        label='Center'
        state={center}
        onChange={(s) => onUpdate({ ...params, center: positionToParam(s) })}
      />

      <div>
        <Label className='text-xs font-medium mb-1 block'>Major Axis</Label>
        <div className='grid grid-cols-3 gap-2'>
          {(['X', 'Y', 'Z'] as const).map((ax, i) => (
            <div key={ax}>
              <Label className='text-xs text-muted-foreground'>{ax}</Label>
              <Input
                className='h-8 text-sm font-mono'
                type='number'
                step='0.1'
                value={getVec3('major_axis')[i]}
                onChange={(e) => handleVec3('major_axis', i as 0 | 1 | 2, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className='text-xs font-medium mb-1 block'>Minor Axis</Label>
        <div className='grid grid-cols-3 gap-2'>
          {(['X', 'Y', 'Z'] as const).map((ax, i) => (
            <div key={ax}>
              <Label className='text-xs text-muted-foreground'>{ax}</Label>
              <Input
                className='h-8 text-sm font-mono'
                type='number'
                step='0.1'
                value={getVec3('minor_axis')[i]}
                onChange={(e) => handleVec3('minor_axis', i as 0 | 1 | 2, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <Label className='text-xs font-medium'>Radius Scale</Label>
          <Input
            className='h-8 text-sm font-mono mt-1'
            type='number'
            step='0.1'
            min='0'
            placeholder='auto'
            value={typeof params.radius_scale === 'number' ? params.radius_scale : ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
              const next = { ...params };
              if (v === undefined) delete next.radius_scale;
              else next.radius_scale = v;
              onUpdate(next);
            }}
          />
        </div>
        <div>
          <Label className='text-xs font-medium'>Color</Label>
          <Input
            className='h-8 text-sm mt-1'
            placeholder='#ffffff or name'
            value={typeof params.color === 'string' ? params.color : ''}
            onChange={(e) => onUpdate({ ...params, color: e.target.value || undefined })}
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
