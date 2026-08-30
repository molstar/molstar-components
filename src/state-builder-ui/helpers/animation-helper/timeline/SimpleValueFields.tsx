'use client';

import { Input } from '../../../base/input.tsx';
import { Label } from '../../../base/label.tsx';
import { NumericInput } from '../../../components/NumericInput.tsx';
import { SliderVec3Row } from '../../../components/SliderVec3Row.tsx';
import type { SimpleInterpolationStep } from '../../../../state-builder/index.ts';
import { toVec3 } from './utils.ts';
import { RotationMatrixFields } from './RotationMatrixFields.tsx';

export function SimpleValueFields({
  step,
  onUpdate,
}: {
  step: SimpleInterpolationStep;
  onUpdate: (updates: Partial<SimpleInterpolationStep>) => void;
}) {
  if (step.kind === 'scalar') {
    const startVal = typeof step.start === 'number' ? step.start : '';
    const endVal = typeof step.end === 'number' ? step.end : '';
    return (
      <div className='flex gap-2'>
        <div className='flex-1'>
          <Label className='text-[10px] text-muted-foreground'>Start</Label>
          <NumericInput
            className='h-7 text-xs no-spinners'
            placeholder='0'
            value={typeof startVal === 'number' ? startVal : undefined}
            onChange={(v) => onUpdate({ start: v as unknown as number })}
          />
        </div>
        <div className='flex-1'>
          <Label className='text-[10px] text-muted-foreground'>End</Label>
          <NumericInput
            className='h-7 text-xs no-spinners'
            placeholder='1'
            value={typeof endVal === 'number' ? endVal : undefined}
            onChange={(v) => onUpdate({ end: v as unknown as number })}
          />
        </div>
      </div>
    );
  }

  if (step.kind === 'vec3') {
    return (
      <div className='space-y-1'>
        <SliderVec3Row
          label='Start'
          value={toVec3(Array.isArray(step.start) ? step.start as number[] : null, [0, 0, 0])}
          onChange={(v) => onUpdate({ start: v })}
          defaultRange={[-200, 200]}        />
        <SliderVec3Row
          label='End'
          value={toVec3(Array.isArray(step.end) ? step.end as number[] : null, [0, 0, 0])}
          onChange={(v) => onUpdate({ end: v })}
          defaultRange={[-200, 200]}        />
      </div>
    );
  }

  if (step.kind === 'color') {
    const startColor = typeof step.start === 'string' ? step.start : String(step.start ?? '');
    const endColor = typeof step.end === 'string' ? step.end : String(step.end ?? '');
    return (
      <div className='flex gap-2'>
        <div className='flex-1 space-y-0.5'>
          <Label className='text-[10px] text-muted-foreground'>Start Color</Label>
          <div className='flex gap-1'>
            <Input
              className='h-7 text-xs flex-1'
              placeholder='#FF0000'
              value={startColor}
              onChange={(e) => onUpdate({ start: e.target.value as unknown as number })}
            />
            <input
              type='color'
              className='w-7 h-7 rounded border cursor-pointer p-0'
              value={startColor.startsWith('#') ? startColor : '#808080'}
              onChange={(e) => onUpdate({ start: e.target.value as unknown as number })}
            />
          </div>
        </div>
        <div className='flex-1 space-y-0.5'>
          <Label className='text-[10px] text-muted-foreground'>End Color</Label>
          <div className='flex gap-1'>
            <Input
              className='h-7 text-xs flex-1'
              placeholder='#0000FF'
              value={endColor}
              onChange={(e) => onUpdate({ end: e.target.value as unknown as number })}
            />
            <input
              type='color'
              className='w-7 h-7 rounded border cursor-pointer p-0'
              value={endColor.startsWith('#') ? endColor : '#808080'}
              onChange={(e) => onUpdate({ end: e.target.value as unknown as number })}
            />
          </div>
        </div>
      </div>
    );
  }

  if (step.kind === 'rotation_matrix') {
    return (
      <RotationMatrixFields step={step} onUpdate={onUpdate} />
    );
  }

  return null;
}
