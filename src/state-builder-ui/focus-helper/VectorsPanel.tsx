'use client';

import { Label } from '../ui/label.tsx';
import { Button } from '../ui/button.tsx';
import { NumericInput } from '../components/NumericInput.tsx';
import type { VectorsPanelProps } from './types.ts';

const DEFAULT_DIRECTION: [number, number, number] = [0, 0, -1];
const DEFAULT_UP: [number, number, number] = [0, 1, 0];

function Vector3Row({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  value: [number, number, number] | undefined;
  defaultValue: [number, number, number];
  onChange: (v: [number, number, number] | undefined) => void;
}) {
  const isCustom = value !== undefined;
  const displayValue = value ?? defaultValue;

  const handleChange = (axis: 0 | 1 | 2, num: number) => {
    const next: [number, number, number] = [...displayValue] as [number, number, number];
    next[axis] = num;
    onChange(next);
  };

  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-2'>
        <Label className='text-xs font-medium flex-1'>{label}</Label>
        <Button
          size='sm'
          variant='ghost'
          className='h-5 text-xs px-2'
          onClick={() => onChange(isCustom ? undefined : ([...defaultValue] as [number, number, number]))}
        >
          {isCustom ? 'Use default' : 'Set custom'}
        </Button>
      </div>
      <div className={`grid grid-cols-3 gap-2 ${!isCustom ? 'opacity-40 pointer-events-none' : ''}`}>
        {(['X', 'Y', 'Z'] as const).map((axis, i) => (
          <div key={axis}>
            <Label className='text-xs text-muted-foreground'>{axis}</Label>
            <NumericInput
              className='h-8 text-sm font-mono'
              value={displayValue[i]}
              disabled={!isCustom}
              onChange={(v) => handleChange(i as 0 | 1 | 2, v ?? 0)}
              title={`${label} ${axis}`}
            />
          </div>
        ))}
      </div>
      {!isCustom && (
        <p className='text-xs text-muted-foreground'>
          MVS default: [{defaultValue.join(', ')}]
        </p>
      )}
    </div>
  );
}

export function VectorsPanel({ direction, up, onDirectionChange, onUpChange }: VectorsPanelProps) {
  return (
    <div className='space-y-4 pt-1'>
      <Vector3Row
        label='Direction'
        value={direction}
        defaultValue={DEFAULT_DIRECTION}
        onChange={onDirectionChange}
      />
      <Vector3Row
        label='Up'
        value={up}
        defaultValue={DEFAULT_UP}
        onChange={onUpChange}
      />
    </div>
  );
}
