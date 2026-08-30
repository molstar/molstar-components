'use client';

import { Label } from '../../../base/label.tsx';
import { NumericInput } from '../../../components/NumericInput.tsx';
import type { InterpolationStep, SimpleInterpolationStep } from '../../../../state-builder/index.ts';

export function AdvancedOptions({
  step,
  onUpdate,
}: {
  step: InterpolationStep;
  onUpdate: (updates: Partial<InterpolationStep>) => void;
}) {
  if (step.kind === 'transform_matrix') {
    // Transform matrix advanced options are in channel sections
    return (
      <div className='text-xs text-muted-foreground pl-2'>
        Advanced options for transform_matrix are in each channel section above.
      </div>
    );
  }

  const simple = step as SimpleInterpolationStep;

  return (
    <div className='grid grid-cols-3 gap-2 pl-2'>
      <div>
        <Label className='text-[10px] text-muted-foreground'>Frequency</Label>
        <NumericInput
          className='h-7 text-xs no-spinners'
          placeholder='1'
          value={simple.frequency ?? undefined}
          onChange={(v) => onUpdate({ frequency: v } as Partial<SimpleInterpolationStep>)}
        />
      </div>
      <div className='flex flex-col gap-1'>
        <label className='flex items-center gap-1 text-[10px] pt-3'>
          <input
            type='checkbox'
            checked={simple.alternate_direction ?? false}
            onChange={(e) => onUpdate({ alternate_direction: e.target.checked } as Partial<SimpleInterpolationStep>)}
            className='accent-primary'
          />
          Alternate direction
        </label>
      </div>
      <div>
        <Label className='text-[10px] text-muted-foreground'>Noise</Label>
        <NumericInput
          className='h-7 text-xs no-spinners'
          placeholder='0'
          value={simple.noise_magnitude ?? undefined}
          onChange={(v) => onUpdate({ noise_magnitude: v } as Partial<SimpleInterpolationStep>)}
        />
      </div>
      {simple.kind === 'scalar' && (
        <label className='flex items-center gap-1 text-[10px]'>
          <input
            type='checkbox'
            checked={simple.discrete ?? false}
            onChange={(e) => onUpdate({ discrete: e.target.checked } as Partial<SimpleInterpolationStep>)}
            className='accent-primary'
          />
          Discrete (round to int)
        </label>
      )}
      {simple.kind === 'vec3' && (
        <label className='flex items-center gap-1 text-[10px]'>
          <input
            type='checkbox'
            checked={simple.spherical ?? false}
            onChange={(e) => onUpdate({ spherical: e.target.checked } as Partial<SimpleInterpolationStep>)}
            className='accent-primary'
          />
          Spherical interpolation
        </label>
      )}
    </div>
  );
}
