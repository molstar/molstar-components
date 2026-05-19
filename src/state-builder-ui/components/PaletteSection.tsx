'use client';

import { useState } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select.tsx';
import { cn } from '../lib/utils.ts';

export type PaletteKind = 'categorical' | 'discrete' | 'continuous';

export interface PaletteValue {
  kind: PaletteKind;
  colors: string;
  missing_color: string;
}

interface PaletteSectionProps {
  value: PaletteValue | null;
  onChange: (value: PaletteValue | null) => void;
}

const DEFAULT_PALETTE: PaletteValue = { kind: 'categorical', colors: '', missing_color: '' };

export function paletteFromParams(params: Record<string, unknown>): PaletteValue | null {
  const p = params.palette as Record<string, unknown> | null | undefined;
  if (!p || typeof p !== 'object') return null;
  return {
    kind: (p.kind as PaletteKind) ?? 'categorical',
    colors: typeof p.colors === 'string' ? p.colors : '',
    missing_color: typeof p.missing_color === 'string' ? p.missing_color : '',
  };
}

export function paletteToParams(value: PaletteValue | null): Record<string, unknown> | undefined {
  if (!value) return undefined;
  const result: Record<string, unknown> = { kind: value.kind };
  if (value.colors) result.colors = value.colors;
  if (value.missing_color && value.kind === 'categorical') result.missing_color = value.missing_color;
  return result;
}

export function PaletteSection({ value, onChange }: PaletteSectionProps) {
  const [open, setOpen] = useState(false);

  const palette = value ?? DEFAULT_PALETTE;

  const handleEnable = () => {
    if (!value) onChange(DEFAULT_PALETTE);
    setOpen(true);
  };

  const update = (patch: Partial<PaletteValue>) => {
    onChange({ ...palette, ...patch });
  };

  return (
    <div className='flex flex-col gap-1'>
      <button type='button' className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit' onClick={() => { if (!value) handleEnable(); else setOpen(o => !o); }}>
        <ChevronRightIcon className={cn('size-3 transition-transform', open && value && 'rotate-90')} />
        Palette
        {value && !open && <span className='text-foreground'>({value.kind})</span>}
      </button>
      {open && (
        <div className='flex flex-col gap-2 pl-4 pt-1'>
          <div className='flex gap-2 items-end'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Kind</Label>
              <Select value={palette.kind} onValueChange={(v) => update({ kind: v as PaletteKind })}>
                <SelectTrigger size='sm' className='w-32'><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='categorical'>categorical</SelectItem>
                  <SelectItem value='discrete'>discrete</SelectItem>
                  <SelectItem value='continuous'>continuous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-1 flex-1'>
              <Label className='text-xs'>Colors <span className='text-muted-foreground font-normal'>(name or leave blank)</span></Label>
              <Input className='h-7 text-xs font-mono' placeholder='ResidueName, Viridis, …' value={palette.colors} onChange={(e) => update({ colors: e.target.value })} />
            </div>
          </div>
          {palette.kind === 'categorical' && (
            <div className='flex flex-col gap-1 w-36'>
              <Label className='text-xs'>Missing color <span className='text-muted-foreground font-normal'>(optional)</span></Label>
              <Input className='h-7 text-xs font-mono' placeholder='yellow' value={palette.missing_color} onChange={(e) => update({ missing_color: e.target.value })} />
            </div>
          )}
          <button type='button' className='text-xs text-muted-foreground hover:text-destructive w-fit' onClick={() => { onChange(null); setOpen(false); }}>
            Remove palette
          </button>
        </div>
      )}
    </div>
  );
}
