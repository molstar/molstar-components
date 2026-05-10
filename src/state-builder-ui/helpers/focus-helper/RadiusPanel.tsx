'use client';

import { Label } from '../../base/label.tsx';
import { Button } from '../../base/button.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import type { RadiusPanelProps } from './types.ts';

export function RadiusPanel({
  radiusFactor,
  radiusExtent,
  radius,
  onRadiusFactorChange,
  onRadiusExtentChange,
  onRadiusChange,
}: RadiusPanelProps) {
  const mode: 'relative' | 'absolute' = radius !== null ? 'absolute' : 'relative';

  return (
    <div className='space-y-3 pt-1'>
      <div className='flex gap-2'>
        <Button
          size='sm'
          variant={mode === 'relative' ? 'default' : 'outline'}
          onClick={() => { if (mode === 'absolute') onRadiusChange(null); }}
        >
          Relative
        </Button>
        <Button
          size='sm'
          variant={mode === 'absolute' ? 'default' : 'outline'}
          onClick={() => { if (mode === 'relative') onRadiusChange(10); }}
        >
          Absolute
        </Button>
      </div>

      {mode === 'relative' ? (
        <div className='space-y-3'>
          <div>
            <Label className='text-xs'>Radius factor</Label>
            <p className='text-xs text-muted-foreground mb-1'>Multiplier on bounding sphere radius (default: 1)</p>
            <NumericInput
              className='h-8 text-sm font-mono'
              value={radiusFactor}
              onChange={(v) => onRadiusFactorChange(v ?? 1)}
            />
          </div>
          <div>
            <Label className='text-xs'>Radius extent</Label>
            <p className='text-xs text-muted-foreground mb-1'>Additional additive extent in Å (default: 0)</p>
            <NumericInput
              className='h-8 text-sm font-mono'
              value={radiusExtent}
              onChange={(v) => onRadiusExtentChange(v ?? 0)}
            />
          </div>
        </div>
      ) : (
        <div>
          <Label className='text-xs'>Radius (Å)</Label>
          <p className='text-xs text-muted-foreground mb-1'>Absolute radius, overrides factor and extent</p>
          <NumericInput
            className='h-8 text-sm font-mono'
            value={radius ?? 10}
            onChange={(v) => onRadiusChange(v ?? 0)}
          />
        </div>
      )}
    </div>
  );
}
