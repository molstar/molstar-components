'use client';

import { SliderVec3Row } from '../../components/SliderVec3Row.tsx';
import type { TranslationPanelProps } from './types.ts';

export function TranslationPanel({ x, y, z, onChange }: TranslationPanelProps) {
  return (
    <div className='space-y-2'>
      <SliderVec3Row
        label='Translation (X, Y, Z)'
        value={[x, y, z]}
        onChange={(v) => onChange(v[0], v[1], v[2])}
        defaultRange={[-100, 100]}
      />
      <p className='text-xs text-muted-foreground'>
        Applied after rotation. Units match structure coordinates.
      </p>
    </div>
  );
}
