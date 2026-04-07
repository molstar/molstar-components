'use client';

import { useState } from 'react';
import { Label } from '../base/label.tsx';
import { Button } from '../base/button.tsx';
import { NumericInput } from './NumericInput.tsx';

interface SliderVec3RowProps {
  label: string;
  value: [number, number, number];
  onChange: (v: [number, number, number]) => void;
  defaultRange: [number, number];
  disabled?: boolean;
  initialMode?: 'slider' | 'xyz';
}

const AXES = ['X', 'Y', 'Z'] as const;

export function SliderVec3Row({ label, value, onChange, defaultRange, disabled, initialMode }: SliderVec3RowProps) {
  const [mode, setMode] = useState<'slider' | 'xyz'>(initialMode ?? 'slider');
  const [range, setRange] = useState<[number, number]>(defaultRange);

  const handleChange = (axis: 0 | 1 | 2, v: number) => {
    const next: [number, number, number] = [value[0], value[1], value[2]];
    next[axis] = v;
    onChange(next);
  };

  const step = (range[1] - range[0]) / 200;

  return (
    <div className='space-y-1'>
      {label && (
        <div className='flex items-center gap-1'>
          <Label className='text-xs font-medium flex-1'>{label}</Label>
          <div className='flex items-center gap-0.5'>
            <Button
              size='sm'
              variant={mode === 'slider' ? 'default' : 'ghost'}
              className='h-5 text-xs px-2'
              onClick={() => setMode('slider')}
              title='Slider controls'
              disabled={disabled}
            >
              Slider
            </Button>
            <Button
              size='sm'
              variant={mode === 'xyz' ? 'default' : 'ghost'}
              className='h-5 text-xs px-2'
              onClick={() => setMode('xyz')}
              title='Numeric XYZ inputs'
              disabled={disabled}
            >
              XYZ
            </Button>
          </div>
        </div>
      )}

      {mode === 'slider' ? (
        <div className='space-y-1'>
          {AXES.map((axis, i) => (
            <div key={axis} className='flex items-center gap-2'>
              <Label className='text-xs text-muted-foreground w-4 shrink-0'>{axis}</Label>
              <input
                type='range'
                min={range[0]}
                max={range[1]}
                step={step}
                value={Math.min(range[1], Math.max(range[0], value[i]))}
                disabled={disabled}
                onChange={(e) => handleChange(i as 0 | 1 | 2, parseFloat(e.target.value))}
                className='flex-1 accent-primary cursor-pointer disabled:opacity-40 disabled:cursor-default'
                title={`${label} ${axis}: ${value[i].toFixed(3)}`}
              />
              <span className='text-xs font-mono w-16 text-right tabular-nums text-muted-foreground'>
                {value[i].toFixed(3)}
              </span>
            </div>
          ))}
          <div className='flex items-center gap-2 pt-0.5'>
            <Label className='text-xs text-muted-foreground shrink-0'>Range</Label>
            <NumericInput
              className='h-6 text-xs font-mono w-16 no-spinners'
              value={range[0]}
              disabled={disabled}
              onChange={(v) => { if (v !== undefined) setRange([v, range[1]]); }}
              title='Slider minimum'
            />
            <span className='text-xs text-muted-foreground'>–</span>
            <NumericInput
              className='h-6 text-xs font-mono w-16 no-spinners'
              value={range[1]}
              disabled={disabled}
              onChange={(v) => { if (v !== undefined) setRange([range[0], v]); }}
              title='Slider maximum'
            />
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-3 gap-2'>
          {AXES.map((axis, i) => (
            <div key={axis}>
              <Label className='text-xs text-muted-foreground'>{axis}</Label>
              <NumericInput
                className='h-8 text-sm font-mono no-spinners'
                value={value[i]}
                disabled={disabled}
                onChange={(v) => handleChange(i as 0 | 1 | 2, v ?? 0)}
                title={`${label} ${axis}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
