'use client';

import { useState } from 'react';
import { ChevronRightIcon, XIcon } from 'lucide-react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select.tsx';
import { NumericInput } from './NumericInput.tsx';
import { cn } from '../lib/utils.ts';

export type PaletteKind = 'categorical' | 'discrete' | 'continuous';

export interface CategoricalPaletteValue {
  kind: 'categorical';
  colors: string;
  missing_color: string;
}

export interface DiscreteColorEntry {
  color: string;
  from: number | undefined;
  to: number | undefined;
}

export interface DiscretePaletteValue {
  kind: 'discrete';
  mode: 'absolute' | 'normalized';
  colors: DiscreteColorEntry[];
}

export interface ContinuousPaletteValue {
  kind: 'continuous';
  mode: 'absolute' | 'normalized';
  colors: string;
  value_domain_min: number | undefined;
  value_domain_max: number | undefined;
}

export type PaletteValue = CategoricalPaletteValue | DiscretePaletteValue | ContinuousPaletteValue;

const DEFAULTS: Record<PaletteKind, PaletteValue> = {
  categorical: { kind: 'categorical', colors: '', missing_color: '' },
  discrete: { kind: 'discrete', mode: 'normalized', colors: [] },
  continuous: { kind: 'continuous', mode: 'normalized', colors: '', value_domain_min: undefined, value_domain_max: undefined },
};

export function paletteFromParams(params: Record<string, unknown>): PaletteValue | null {
  const p = params.palette as Record<string, unknown> | null | undefined;
  if (!p || typeof p !== 'object') return null;
  const kind = p.kind as PaletteKind;
  if (kind === 'categorical') {
    return {
      kind: 'categorical',
      colors: typeof p.colors === 'string' ? p.colors : '',
      missing_color: typeof p.missing_color === 'string' ? p.missing_color : '',
    };
  }
  if (kind === 'discrete') {
    const rawColors = Array.isArray(p.colors) ? p.colors : [];
    return {
      kind: 'discrete',
      mode: (p.mode as 'absolute' | 'normalized') ?? 'normalized',
      colors: rawColors.map((entry: unknown) => {
        if (Array.isArray(entry) && entry.length >= 3) {
          return { color: String(entry[0]), from: typeof entry[1] === 'number' ? entry[1] : undefined, to: typeof entry[2] === 'number' ? entry[2] : undefined };
        }
        return { color: '', from: undefined, to: undefined };
      }),
    };
  }
  if (kind === 'continuous') {
    const domain = Array.isArray(p.value_domain) ? p.value_domain : [];
    return {
      kind: 'continuous',
      mode: (p.mode as 'absolute' | 'normalized') ?? 'normalized',
      colors: typeof p.colors === 'string' ? p.colors : '',
      value_domain_min: typeof domain[0] === 'number' ? domain[0] : undefined,
      value_domain_max: typeof domain[1] === 'number' ? domain[1] : undefined,
    };
  }
  return null;
}

export function paletteToParams(value: PaletteValue | null): Record<string, unknown> | undefined {
  if (!value) return undefined;
  if (value.kind === 'categorical') {
    const result: Record<string, unknown> = { kind: 'categorical' };
    if (value.colors) result.colors = value.colors;
    if (value.missing_color) result.missing_color = value.missing_color;
    return result;
  }
  if (value.kind === 'discrete') {
    const result: Record<string, unknown> = { kind: 'discrete', mode: value.mode };
    const validColors = value.colors
      .filter(e => e.color && e.from !== undefined && e.to !== undefined)
      .map(e => [e.color, e.from, e.to]);
    if (validColors.length > 0) result.colors = validColors;
    return result;
  }
  if (value.kind === 'continuous') {
    const result: Record<string, unknown> = { kind: 'continuous', mode: value.mode };
    if (value.colors) result.colors = value.colors;
    if (value.value_domain_min !== undefined && value.value_domain_max !== undefined) {
      result.value_domain = [value.value_domain_min, value.value_domain_max];
    }
    return result;
  }
  return undefined;
}

interface PaletteSectionProps {
  value: PaletteValue | null;
  onChange: (value: PaletteValue | null) => void;
}

export function PaletteSection({ value, onChange }: PaletteSectionProps) {
  const [open, setOpen] = useState(false);

  const handleKindChange = (kind: PaletteKind) => {
    onChange(DEFAULTS[kind]);
  };

  const renderBadge = () => {
    if (!value || open) return null;
    if (value.kind === 'discrete') return <span className='text-foreground'>({value.kind}, {value.colors.length} colors)</span>;
    return <span className='text-foreground'>({value.kind})</span>;
  };

  return (
    <div className='flex flex-col gap-1'>
      <button
        type='button'
        className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit'
        onClick={() => { if (!value) onChange(DEFAULTS.categorical); setOpen(o => !o); }}
      >
        <ChevronRightIcon className={cn('size-3 transition-transform', open && 'rotate-90')} />
        Palette
        {renderBadge()}
      </button>
      {open && (
        <div className='flex flex-col gap-2 pl-4 pt-1'>
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>Kind</Label>
            <Select value={value?.kind ?? 'categorical'} onValueChange={(v) => handleKindChange(v as PaletteKind)}>
              <SelectTrigger size='sm' className='w-32'><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value='categorical'>categorical</SelectItem>
                <SelectItem value='discrete'>discrete</SelectItem>
                <SelectItem value='continuous'>continuous</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {value?.kind === 'categorical' && (
            <>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Colors <span className='text-muted-foreground font-normal'>(name or leave blank)</span></Label>
                <Input className='h-7 text-xs font-mono' placeholder='ResidueName, Viridis, …' value={value.colors} onChange={(e) => onChange({ ...value, colors: e.target.value })} />
              </div>
              <div className='flex flex-col gap-1 w-36'>
                <Label className='text-xs'>Missing color <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                <Input className='h-7 text-xs font-mono' placeholder='yellow' value={value.missing_color} onChange={(e) => onChange({ ...value, missing_color: e.target.value })} />
              </div>
            </>
          )}

          {value?.kind === 'discrete' && (
            <>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Mode</Label>
                <Select value={value.mode} onValueChange={(v) => onChange({ ...value, mode: v as 'absolute' | 'normalized' })}>
                  <SelectTrigger size='sm' className='w-32'><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='absolute'>absolute</SelectItem>
                    <SelectItem value='normalized'>normalized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Colors <span className='text-muted-foreground font-normal'>(color, from, to)</span></Label>
                {value.colors.map((entry, i) => (
                  <div key={i} className='flex items-center gap-1'>
                    <input
                      type='color'
                      className='h-6 w-8 cursor-pointer rounded border shrink-0'
                      value={entry.color.match(/^#[0-9a-fA-F]{6}$/) ? entry.color : '#000000'}
                      onChange={(e) => {
                        const next = [...value.colors];
                        next[i] = { ...next[i], color: e.target.value };
                        onChange({ ...value, colors: next });
                      }}
                    />
                    <Input
                      className='h-6 text-xs font-mono w-20'
                      placeholder='#rrggbb'
                      value={entry.color}
                      onChange={(e) => {
                        const next = [...value.colors];
                        next[i] = { ...next[i], color: e.target.value };
                        onChange({ ...value, colors: next });
                      }}
                    />
                    <NumericInput
                      className='h-6 text-xs font-mono w-16'
                      placeholder='from'
                      value={entry.from}
                      onChange={(v) => {
                        const next = [...value.colors];
                        next[i] = { ...next[i], from: v };
                        onChange({ ...value, colors: next });
                      }}
                    />
                    <NumericInput
                      className='h-6 text-xs font-mono w-16'
                      placeholder='to'
                      value={entry.to}
                      onChange={(v) => {
                        const next = [...value.colors];
                        next[i] = { ...next[i], to: v };
                        onChange({ ...value, colors: next });
                      }}
                    />
                    <button
                      type='button'
                      className='text-muted-foreground hover:text-destructive'
                      onClick={() => onChange({ ...value, colors: value.colors.filter((_, j) => j !== i) })}
                    >
                      <XIcon className='size-3' />
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  className='text-xs text-muted-foreground hover:text-foreground w-fit'
                  onClick={() => onChange({ ...value, colors: [...value.colors, { color: '', from: undefined, to: undefined }] })}
                >
                  + Add color
                </button>
              </div>
            </>
          )}

          {value?.kind === 'continuous' && (
            <>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Mode</Label>
                <Select value={value.mode} onValueChange={(v) => onChange({ ...value, mode: v as 'absolute' | 'normalized' })}>
                  <SelectTrigger size='sm' className='w-32'><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='absolute'>absolute</SelectItem>
                    <SelectItem value='normalized'>normalized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Colors <span className='text-muted-foreground font-normal'>(color list name)</span></Label>
                <Input className='h-7 text-xs font-mono' placeholder='Plasma, Viridis, …' value={value.colors} onChange={(e) => onChange({ ...value, colors: e.target.value })} />
              </div>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Value domain <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                <div className='flex items-center gap-1'>
                  <NumericInput className='h-7 text-xs font-mono w-20' placeholder='min' value={value.value_domain_min} onChange={(v) => onChange({ ...value, value_domain_min: v })} />
                  <span className='text-xs text-muted-foreground'>–</span>
                  <NumericInput className='h-7 text-xs font-mono w-20' placeholder='max' value={value.value_domain_max} onChange={(v) => onChange({ ...value, value_domain_max: v })} />
                </div>
              </div>
            </>
          )}

          <button type='button' className='text-xs text-muted-foreground hover:text-destructive w-fit' onClick={() => { onChange(null); setOpen(false); }}>
            Remove palette
          </button>
        </div>
      )}
    </div>
  );
}
