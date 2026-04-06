'use client';

import { Button } from '../../base/button.tsx';
import { Label } from '../../base/label.tsx';
import { CAMERA_PRESETS } from '@molstar/state-builder';
import type { PresetsPanelProps } from './types.ts';

export function PresetsPanel({ onSelect }: PresetsPanelProps) {
  return (
    <div className='space-y-2'>
      <Label className='text-sm'>Camera Presets</Label>
      <div className='grid grid-cols-3 gap-2'>
        {CAMERA_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            size='sm'
            variant='outline'
            onClick={() => onSelect({ position: preset.position, target: preset.target, up: preset.up })}
            title={preset.description}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <p className='text-xs text-muted-foreground'>
        Axis-aligned views at distance 100 from origin. Adjust position after selecting.
      </p>
    </div>
  );
}
