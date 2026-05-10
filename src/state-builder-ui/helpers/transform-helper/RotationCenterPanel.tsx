'use client';

import { Label } from '../../base/label.tsx';
import { Button } from '../../base/button.tsx';
import { SliderVec3Row } from '../../components/SliderVec3Row.tsx';
import type { RotationCenterPanelProps } from './types.ts';

export function RotationCenterPanel({
  mode,
  x,
  y,
  z,
  onModeChange,
  onCoordsChange,
}: RotationCenterPanelProps) {
  return (
    <div className='space-y-3'>
      <Label className='text-sm'>Rotation Center</Label>
      <div className='flex gap-2'>
        {(['none', 'centroid', 'custom'] as const).map((m) => (
          <Button
            key={m}
            size='sm'
            variant={mode === m ? 'default' : 'outline'}
            onClick={() => onModeChange(m)}
            className='flex-1'
          >
            {m === 'none' ? 'Default (origin)' : m === 'centroid' ? 'Centroid' : 'Custom'}
          </Button>
        ))}
      </div>

      {mode === 'centroid' && (
        <p className='text-xs text-muted-foreground'>
          Rotation will be applied around the dynamically computed object centroid.
        </p>
      )}

      {mode === 'custom' && (
        <SliderVec3Row
          label='Center (X, Y, Z)'
          value={[x, y, z]}
          onChange={(v) => onCoordsChange(v[0], v[1], v[2])}
          defaultRange={[-100, 100]}
        />
      )}

      {mode === 'none' && (
        <p className='text-xs text-muted-foreground'>
          No explicit rotation center. Rotation applies around the origin.
        </p>
      )}
    </div>
  );
}
