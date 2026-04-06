'use client';

import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import type { PrimitiveKindFieldsProps } from './types.ts';

export function MeshFields({ params, onUpdate }: PrimitiveKindFieldsProps) {
  return (
    <div className='space-y-3'>
      <p className='text-xs text-muted-foreground border rounded-md p-3 bg-muted/40'>
        Mesh requires vertex/triangle data. Use the <strong>Raw</strong> tab to supply full params.
      </p>

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
          <Label className='text-xs font-medium'>Opacity</Label>
          <Input
            className='h-8 text-sm font-mono mt-1'
            type='number'
            step='0.05'
            min='0'
            max='1'
            placeholder='auto'
            value={typeof params.opacity === 'number' ? params.opacity : ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
              const next = { ...params };
              if (v === undefined) delete next.opacity;
              else next.opacity = v;
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
