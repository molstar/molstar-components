'use client';

import { Label } from '../../base/label.tsx';
import type { RawPanelProps } from './types.ts';

export function RawPanel({ value, error, onChange }: RawPanelProps) {
  return (
    <div>
      <Label className='text-sm'>Raw Camera JSON</Label>
      <textarea
        className='w-full h-32 mt-2 p-2 text-sm font-mono border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring'
        placeholder='{ "position": [0, 0, 100], "target": [0, 0, 0], "up": [0, 1, 0] }'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className='text-xs text-destructive mt-1'>{error}</p>}
      <p className='text-xs text-muted-foreground mt-1'>
        Enter a JSON object with position (required), target (required), and up (optional) vectors.
      </p>
    </div>
  );
}
