'use client';

import { SliderVec3Row } from '../../components/SliderVec3Row.tsx';
import type { VectorsPanelProps } from './types.ts';

export function VectorsPanel({
  position,
  target,
  up,
  onPositionChange,
  onTargetChange,
  onUpChange,
}: VectorsPanelProps) {
  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return (
    <div className='space-y-3'>
      <SliderVec3Row
        label='Position'
        value={position}
        onChange={onPositionChange}
        defaultRange={[-200, 200]}
      />
      <SliderVec3Row
        label='Target'
        value={target}
        onChange={onTargetChange}
        defaultRange={[-200, 200]}
      />
      <SliderVec3Row
        label='Up'
        value={up}
        onChange={onUpChange}
        defaultRange={[-1, 1]}
      />
      <div className='text-xs text-muted-foreground'>
        Distance: {distance.toFixed(2)}
      </div>
    </div>
  );
}
