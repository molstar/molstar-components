'use client';

import { Label } from '../../base/label.tsx';
import type { RawPanelProps } from './types.ts';

export function RawPanel({ value, error, onChange }: RawPanelProps) {
  return (
    <div>
      <Label className='text-sm'>Raw Transform JSON</Label>
      <textarea
        className='w-full h-32 mt-2 p-2 text-sm font-mono border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring'
        placeholder='{ "rotation": [...], "translation": [...] }'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className='text-xs text-destructive mt-1'>{error}</p>}
      <p className='text-xs text-muted-foreground mt-1'>
        Enter a JSON object with rotation (9 values), translation (3 values), rotation_center, or matrix (16 values).
      </p>
    </div>
  );
}
