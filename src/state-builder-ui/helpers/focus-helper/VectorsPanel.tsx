'use client';

import { Button } from '../../base/button.tsx';
import { SliderVec3Row } from '../../components/SliderVec3Row.tsx';
import type { VectorsPanelProps } from './types.ts';

const DEFAULT_DIRECTION: [number, number, number] = [0, 0, -1];
const DEFAULT_UP: [number, number, number] = [0, 1, 0];

function Vector3Row({
  label,
  value,
  defaultValue,
  defaultRange,
  onChange,
}: {
  label: string;
  value: [number, number, number] | undefined;
  defaultValue: [number, number, number];
  defaultRange: [number, number];
  onChange: (v: [number, number, number] | undefined) => void;
}) {
  const isCustom = value !== undefined;
  const displayValue = value ?? defaultValue;

  return (
    <div className='space-y-1'>
      <div className='flex items-center justify-end'>
        <Button
          size='sm'
          variant='ghost'
          className='h-5 text-xs px-2'
          onClick={() => onChange(isCustom ? undefined : ([...defaultValue] as [number, number, number]))}
        >
          {isCustom ? 'Use default' : 'Set custom'}
        </Button>
      </div>
      <SliderVec3Row
        label={label}
        value={displayValue}
        onChange={(v) => onChange(v)}
        defaultRange={defaultRange}
        disabled={!isCustom}
      />
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
        defaultRange={[-1, 1]}
        onChange={onDirectionChange}
      />
      <Vector3Row
        label='Up'
        value={up}
        defaultValue={DEFAULT_UP}
        defaultRange={[-1, 1]}
        onChange={onUpChange}
      />
    </div>
  );
}
