'use client';

import { Label } from '../../base/label.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import type { TranslationPanelProps } from './types.ts';

export function TranslationPanel({ x, y, z, onChange }: TranslationPanelProps) {
  const handleChange = (axis: 0 | 1 | 2, num: number) => {
    const vals: [number, number, number] = [x, y, z];
    vals[axis] = num;
    onChange(vals[0], vals[1], vals[2]);
  };

  return (
    <div className='space-y-2'>
      <Label className='text-sm'>Translation Vector (X, Y, Z)</Label>
      <div className='grid grid-cols-3 gap-2'>
        {(['X', 'Y', 'Z'] as const).map((label, i) => (
          <div key={label}>
            <Label className='text-xs text-muted-foreground'>{label}</Label>
            <NumericInput
              className='h-8 text-sm font-mono no-spinners'
              placeholder='0'
              value={[x, y, z][i]}
              onChange={(v) => handleChange(i as 0 | 1 | 2, v ?? 0)}
              title={`${label} translation`}
            />
          </div>
        ))}
      </div>
      <p className='text-xs text-muted-foreground'>
        Applied after rotation. Units match structure coordinates.
      </p>
    </div>
  );
}
