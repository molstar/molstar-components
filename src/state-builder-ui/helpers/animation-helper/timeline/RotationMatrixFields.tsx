'use client';

import { SliderAngleRow } from '../../../components/SliderAngleRow.tsx';
import { IDENTITY_3x3 } from '../../../../state-builder/index.ts';
import type { SimpleInterpolationStep } from '../../../../state-builder/index.ts';

export function RotationMatrixFields({
  step,
  onUpdate,
}: {
  step: SimpleInterpolationStep;
  onUpdate: (updates: Partial<SimpleInterpolationStep>) => void;
}) {
  const startMatrix = (Array.isArray(step.start) && (step.start as number[]).length === 9
    ? step.start as number[]
    : IDENTITY_3x3);
  const endMatrix = (Array.isArray(step.end) && (step.end as number[]).length === 9
    ? step.end as number[]
    : IDENTITY_3x3);

  return (
    <div className='space-y-3'>
      <SliderAngleRow
        label='Start'
        matrix={startMatrix}
        onChange={(m) => onUpdate({ start: m as unknown as number })}
      />
      <SliderAngleRow
        label='End'
        matrix={endMatrix}
        onChange={(m) => onUpdate({ end: m as unknown as number })}
      />
    </div>
  );
}
