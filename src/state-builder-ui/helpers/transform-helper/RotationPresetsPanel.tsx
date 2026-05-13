'use client';

import { Button } from '../../base/button.tsx';
import { Label } from '../../base/label.tsx';
import { ROTATION_PRESETS } from '../../../state-builder/index.ts';
import type { RotationPresetsPanelProps } from './types.ts';

export function RotationPresetsPanel({ onSelect }: RotationPresetsPanelProps) {
  return (
    <div className='space-y-2'>
      <Label className='text-sm'>Rotation Presets</Label>
      <div className='grid grid-cols-2 gap-2'>
        {ROTATION_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            size='sm'
            variant='outline'
            onClick={() => onSelect(preset.matrix)}
            className='justify-start'
            title={preset.description}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <p className='text-xs text-muted-foreground'>
        Selecting a preset replaces the current rotation matrix.
      </p>
    </div>
  );
}
