'use client';

import { Label } from '../../base/label.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import type { EulerAnglesPanelProps } from './types.ts';

export function EulerAnglesPanel({ roll, pitch, yaw, onChange }: EulerAnglesPanelProps) {
  const isGimbalLock = Math.abs(pitch) > 89;

  const handleChange = (axis: 'roll' | 'pitch' | 'yaw', num: number) => {
    switch (axis) {
      case 'roll': onChange(num, pitch, yaw); break;
      case 'pitch': onChange(roll, num, yaw); break;
      case 'yaw': onChange(roll, pitch, num); break;
    }
  };

  return (
    <div className='space-y-2'>
      <Label className='text-sm'>Euler Angles (degrees)</Label>
      <div className='grid grid-cols-3 gap-2'>
        <div>
          <Label className='text-xs text-muted-foreground'>Roll (X)</Label>
          <NumericInput
            className='h-8 text-sm font-mono no-spinners'
            value={parseFloat(roll.toFixed(2))}
            onChange={(v) => handleChange('roll', v ?? 0)}
            title='Roll around X axis'
          />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Pitch (Y)</Label>
          <NumericInput
            className='h-8 text-sm font-mono no-spinners'
            value={parseFloat(pitch.toFixed(2))}
            onChange={(v) => handleChange('pitch', v ?? 0)}
            title='Pitch around Y axis'
          />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground'>Yaw (Z)</Label>
          <NumericInput
            className='h-8 text-sm font-mono no-spinners'
            value={parseFloat(yaw.toFixed(2))}
            onChange={(v) => handleChange('yaw', v ?? 0)}
            title='Yaw around Z axis'
          />
        </div>
      </div>
      {isGimbalLock && (
        <p className='text-xs text-amber-600'>
          Pitch near 90 degrees: gimbal lock may cause unexpected roll/yaw behavior.
        </p>
      )}
      <p className='text-xs text-muted-foreground'>
        ZYX convention: Yaw applied first, then Pitch, then Roll.
      </p>
    </div>
  );
}
