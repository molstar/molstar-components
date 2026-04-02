'use client';

import { Button } from '../ui/button.tsx';
import { Label } from '../ui/label.tsx';
import type { PresetsPanelProps } from './types.ts';

export interface FocusPreset {
  label: string;
  direction: [number, number, number] | undefined;
  up: [number, number, number] | undefined;
}

export const FOCUS_PRESETS: FocusPreset[] = [
  { label: 'Auto', direction: undefined, up: undefined },
  { label: 'Front', direction: [0, 0, -1], up: [0, 1, 0] },
  { label: 'Back', direction: [0, 0, 1], up: [0, 1, 0] },
  { label: 'Top', direction: [0, -1, 0], up: [0, 0, 1] },
  { label: 'Bottom', direction: [0, 1, 0], up: [0, 0, -1] },
  { label: 'Left', direction: [-1, 0, 0], up: [0, 1, 0] },
  { label: 'Right', direction: [1, 0, 0], up: [0, 1, 0] },
];

export function PresetsPanel({ onSelect }: PresetsPanelProps) {
  return (
    <div className='space-y-2 pt-1'>
      <Label className='text-sm'>View Direction Presets</Label>
      <div className='grid grid-cols-3 gap-2'>
        {FOCUS_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            size='sm'
            variant='outline'
            onClick={() => onSelect(preset.direction, preset.up)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <p className='text-xs text-muted-foreground'>
        Selects direction and up vector. Apply to confirm.
      </p>
    </div>
  );
}
