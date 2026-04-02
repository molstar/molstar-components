'use client';

import { Input } from '../ui/input.tsx';
import { Label } from '../ui/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.tsx';
import { LABEL_ATTACHMENT_OPTIONS } from '@molstar/state-builder';
import { PositionEditor } from './PositionEditor.tsx';
import { positionFromParam, positionToParam } from './types.ts';
import type { PrimitiveKindFieldsProps } from './types.ts';

export function LabelFields({ params, onUpdate }: PrimitiveKindFieldsProps) {
  const position = positionFromParam(params.position);

  return (
    <div className='space-y-3'>
      <PositionEditor
        label='Position'
        state={position}
        onChange={(s) => onUpdate({ ...params, position: positionToParam(s) })}
      />

      <div>
        <Label className='text-xs font-medium'>Text</Label>
        <Input
          className='h-8 text-sm mt-1'
          placeholder='Label text'
          value={typeof params.text === 'string' ? params.text : ''}
          onChange={(e) => onUpdate({ ...params, text: e.target.value })}
        />
      </div>

      <div className='grid grid-cols-3 gap-3'>
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
          <Label className='text-xs font-medium'>Label Color</Label>
          <Input
            className='h-8 text-sm mt-1'
            placeholder='inherit'
            value={typeof params.label_color === 'string' ? params.label_color : ''}
            onChange={(e) => onUpdate({ ...params, label_color: e.target.value || undefined })}
          />
        </div>
        <div>
          <Label className='text-xs font-medium'>Label Offset</Label>
          <Input
            className='h-8 text-sm font-mono mt-1'
            type='number'
            step='0.1'
            placeholder='auto'
            value={typeof params.label_offset === 'number' ? params.label_offset : ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
              const next = { ...params };
              if (v === undefined) delete next.label_offset;
              else next.label_offset = v;
              onUpdate(next);
            }}
          />
        </div>
      </div>

      <div>
        <Label className='text-xs font-medium'>Label Attachment</Label>
        <Select
          value={typeof params.label_attachment === 'string' ? params.label_attachment : ''}
          onValueChange={(v) => onUpdate({ ...params, label_attachment: v || undefined })}
        >
          <SelectTrigger className='h-8 text-xs mt-1'>
            <SelectValue placeholder='inherit from group' />
          </SelectTrigger>
          <SelectContent>
            {LABEL_ATTACHMENT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
