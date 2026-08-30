'use client';

import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { Label } from '../../../base/label.tsx';
import { NumericInput } from '../../../components/NumericInput.tsx';
import { EasingSelect } from './EasingSelect.tsx';
import type { EasingType } from '../../../../state-builder/index.ts';

export function ChannelSection({
  label,
  open,
  onToggle,
  easing,
  frequency,
  alternateDirection,
  onEasingChange,
  onFrequencyChange,
  onAlternateDirectionChange,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  easing?: EasingType;
  frequency?: number;
  alternateDirection?: boolean;
  onEasingChange: (v: EasingType) => void;
  onFrequencyChange: (v: number | undefined) => void;
  onAlternateDirectionChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className='border rounded p-2 space-y-1'>
      <button
        className='flex items-center gap-1 text-xs font-medium'
        onClick={onToggle}
      >
        {open ? <ChevronDownIcon className='size-3' /> : <ChevronRightIcon className='size-3' />}
        {label}
      </button>
      {open && (
        <div className='space-y-1 pl-4'>
          {children}
          <div className='flex gap-2 items-end'>
            <div className='w-28'>
              <Label className='text-[10px] text-muted-foreground'>Easing</Label>
              <EasingSelect value={easing} onChange={onEasingChange} />
            </div>
            <div className='w-16'>
              <Label className='text-[10px] text-muted-foreground'>Freq</Label>
              <NumericInput
                className='h-7 text-xs no-spinners'
                placeholder='1'
                value={frequency ?? undefined}
                onChange={onFrequencyChange}
              />
            </div>
            <label className='flex items-center gap-1 text-[10px] pb-1'>
              <input
                type='checkbox'
                checked={alternateDirection ?? false}
                onChange={(e) => onAlternateDirectionChange(e.target.checked)}
                className='accent-primary'
              />
              Alt dir
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
