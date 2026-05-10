'use client';

import { Button } from '../../base/button.tsx';
import { Label } from '../../base/label.tsx';
import { QUICK_SELECTOR_PRESETS } from '@molstar/state-builder';

interface QuickPanelProps {
  onSelect: (value: string) => void;
}

export function QuickPanel({ onSelect }: QuickPanelProps) {
  return (
    <div>
      <Label className='text-sm'>Quick Select Patterns</Label>
      <div className='grid grid-cols-2 gap-2 mt-2'>
        {QUICK_SELECTOR_PRESETS.map((preset) => (
          <Button
            key={preset.value}
            size='sm'
            variant='outline'
            onClick={() => onSelect(preset.value)}
            className='justify-start'
            title={preset.description}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <p className='text-xs text-muted-foreground mt-3'>
        Quick selections apply immediately
      </p>
    </div>
  );
}
