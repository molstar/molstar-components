'use client';

import { Label } from '../../base/label.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import type { VectorsPanelProps } from './types.ts';

function Vector3Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: [number, number, number];
  onChange: (v: [number, number, number]) => void;
}) {
  const handleChange = (axis: 0 | 1 | 2, num: number) => {
    const next: [number, number, number] = [...value];
    next[axis] = num;
    onChange(next);
  };

  return (
    <div className='space-y-1'>
      <Label className='text-xs font-medium'>{label}</Label>
      <div className='grid grid-cols-3 gap-2'>
        {(['X', 'Y', 'Z'] as const).map((axis, i) => (
          <div key={axis}>
            <Label className='text-xs text-muted-foreground'>{axis}</Label>
            <NumericInput
              className='h-8 text-sm font-mono no-spinners'
              value={value[i]}
              onChange={(v) => handleChange(i as 0 | 1 | 2, v ?? 0)}
              title={`${label} ${axis}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function VectorsPanel({
  position,
  target,
  up,
  onPositionChange,
  onTargetChange,
  onUpChange,
}: VectorsPanelProps) {
  // Compute distance
  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return (
    <div className='space-y-3'>
      <Vector3Row label='Position' value={position} onChange={onPositionChange} />
      <Vector3Row label='Target' value={target} onChange={onTargetChange} />
      <Vector3Row label='Up' value={up} onChange={onUpChange} />
      <div className='text-xs text-muted-foreground'>
        Distance: {distance.toFixed(2)}
      </div>
    </div>
  );
}
