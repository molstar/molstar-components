'use client';

import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../base/select.tsx';
import { Switch } from '../../base/switch.tsx';
import { LABEL_ATTACHMENT_OPTIONS } from '@molstar/state-builder';

export interface PrimitivesConfig {
  color?: string;
  label_color?: string;
  tooltip?: string | null;
  opacity?: number;
  label_opacity?: number;
  label_show_tether?: boolean;
  label_tether_length?: number;
  label_attachment?: string;
  label_background_color?: string | null;
  snapshot_key?: string | null;
}

interface PrimitivesConfigPanelProps {
  config: PrimitivesConfig;
  onChange: (config: PrimitivesConfig) => void;
}

function ColorInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  placeholder: string;
  onChange: (v: string | undefined) => void;
}) {
  const strVal = typeof value === 'string' ? value : '';
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      <div className='flex items-center gap-1'>
        {strVal && (
          <span
            className='shrink-0 w-4 h-4 rounded border border-border'
            style={{ background: strVal }}
          />
        )}
        <Input
          className='h-7 text-xs font-mono flex-1'
          placeholder={placeholder}
          value={strVal}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      </div>
    </div>
  );
}

function NullableColorInput({
  label,
  value,
  placeholder,
  nullLabel,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  placeholder: string;
  nullLabel: string;
  onChange: (v: string | null | undefined) => void;
}) {
  const isNull = value === null;
  const strVal = typeof value === 'string' ? value : '';
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      <div className='flex items-center gap-1.5'>
        <span className='text-xs text-muted-foreground shrink-0'>{nullLabel}</span>
        <Switch
          checked={isNull}
          onCheckedChange={(checked) => onChange(checked ? null : undefined)}
        />
      </div>
      {!isNull && (
        <div className='flex items-center gap-1'>
          {strVal && (
            <span
              className='shrink-0 w-4 h-4 rounded border border-border'
              style={{ background: strVal }}
            />
          )}
          <Input
            className='h-7 text-xs font-mono flex-1'
            placeholder={placeholder}
            value={strVal}
            onChange={(e) => onChange(e.target.value || undefined)}
          />
        </div>
      )}
    </div>
  );
}

function OpacityInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className='flex flex-col gap-1'>
      <Label className='text-xs'>{label}</Label>
      <div className='flex items-center gap-2'>
        <input
          type='range'
          min='0'
          max='1'
          step='0.01'
          value={value ?? 1}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className='flex-1 accent-primary'
          disabled={value === undefined}
        />
        <Input
          className='h-7 w-16 text-xs font-mono'
          type='number'
          min='0'
          max='1'
          step='0.01'
          placeholder='auto'
          value={value !== undefined ? value : ''}
          onChange={(e) => {
            const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
            onChange(v);
          }}
        />
      </div>
    </div>
  );
}

export function PrimitivesConfigPanel({ config, onChange }: PrimitivesConfigPanelProps) {
  const set = <K extends keyof PrimitivesConfig>(key: K, value: PrimitivesConfig[K]) => {
    const next = { ...config };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  return (
    <div className='space-y-4'>
      {/* Colors */}
      <div className='grid grid-cols-2 gap-3'>
        <ColorInput
          label='Color'
          value={config.color}
          placeholder='inherit'
          onChange={(v) => set('color', v)}
        />
        <ColorInput
          label='Label Color'
          value={config.label_color}
          placeholder='inherit'
          onChange={(v) => set('label_color', v)}
        />
      </div>

      <NullableColorInput
        label='Label Background'
        value={config.label_background_color}
        placeholder='e.g. white, #cccccc'
        nullLabel='Transparent'
        onChange={(v) => set('label_background_color', v)}
      />

      {/* Opacity */}
      <div className='grid grid-cols-2 gap-3'>
        <OpacityInput
          label='Opacity'
          value={config.opacity}
          onChange={(v) => set('opacity', v)}
        />
        <OpacityInput
          label='Label Opacity'
          value={config.label_opacity}
          onChange={(v) => set('label_opacity', v)}
        />
      </div>

      {/* Tether */}
      <div className='grid grid-cols-2 gap-3'>
        <div className='flex flex-col gap-1'>
          <Label className='text-xs'>Show Tether</Label>
          <div className='flex items-center gap-2 h-7'>
            <Switch
              checked={config.label_show_tether ?? false}
              onCheckedChange={(v) => set('label_show_tether', v || undefined)}
            />
            <span className='text-xs text-muted-foreground'>
              {config.label_show_tether ? 'on' : 'off'}
            </span>
          </div>
        </div>
        <div className='flex flex-col gap-1'>
          <Label className='text-xs'>Tether Length</Label>
          <Input
            className='h-7 text-xs font-mono'
            type='number'
            step='0.1'
            min='0'
            placeholder='1.0'
            value={config.label_tether_length !== undefined ? config.label_tether_length : ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
              set('label_tether_length', v);
            }}
          />
        </div>
      </div>

      {/* Attachment */}
      <div className='flex flex-col gap-1'>
        <Label className='text-xs'>Label Attachment</Label>
        <Select
          value={config.label_attachment ?? '__default__'}
          onValueChange={(v) => set('label_attachment', v === '__default__' ? undefined : v)}
        >
          <SelectTrigger size='sm' className='h-7 text-xs'>
            <SelectValue placeholder='middle-center (default)' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__default__'>Default (middle-center)</SelectItem>
            {LABEL_ATTACHMENT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tooltip */}
      <div className='flex flex-col gap-1'>
        <Label className='text-xs'>Tooltip</Label>
        <Input
          className='h-7 text-xs'
          placeholder='Optional tooltip text'
          value={typeof config.tooltip === 'string' ? config.tooltip : ''}
          onChange={(e) => set('tooltip', e.target.value || undefined)}
        />
      </div>

      {/* Snapshot Key */}
      <div className='flex flex-col gap-1'>
        <Label className='text-xs'>Snapshot Key</Label>
        <Input
          className='h-7 text-xs font-mono'
          placeholder='e.g. intro, step-1'
          value={typeof config.snapshot_key === 'string' ? config.snapshot_key : ''}
          onChange={(e) => set('snapshot_key', e.target.value || undefined)}
        />
        <p className='text-xs text-muted-foreground'>
          When set, interacting with this group loads the matching snapshot. Must match a key defined in scene snapshot options.
        </p>
      </div>
    </div>
  );
}
