'use client';

import { Label } from '../../base/label.tsx';
import { Button } from '../../base/button.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import type { RotationCenterPanelProps } from './types.ts';

export function RotationCenterPanel({
  mode,
  x,
  y,
  z,
  onModeChange,
  onCoordsChange,
}: RotationCenterPanelProps) {
  const handleCoordChange = (axis: 0 | 1 | 2, num: number) => {
    const vals: [number, number, number] = [x, y, z];
    vals[axis] = num;
    onCoordsChange(vals[0], vals[1], vals[2]);
  };

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
        <div className='grid grid-cols-3 gap-2'>
          {(['X', 'Y', 'Z'] as const).map((label, i) => (
            <div key={label}>
              <Label className='text-xs text-muted-foreground'>{label}</Label>
              <NumericInput
                className='h-8 text-sm font-mono no-spinners'
                placeholder='0'
                value={[x, y, z][i]}
                onChange={(v) => handleCoordChange(i as 0 | 1 | 2, v ?? 0)}
                title={`${label} coordinate`}
              />
            </div>
          ))}
        </div>
      )}

      {mode === 'none' && (
        <p className='text-xs text-muted-foreground'>
          No explicit rotation center. Rotation applies around the origin.
        </p>
      )}
    </div>
  );
}
