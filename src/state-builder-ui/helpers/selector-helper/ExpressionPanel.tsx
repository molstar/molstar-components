'use client';

import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../base/select.tsx';
import type { ComponentSelectorObject } from '@molstar/state-builder';
import { NumericInput } from '../../components/NumericInput.tsx';

interface ExpressionPanelProps {
  value: ComponentSelectorObject;
  onChange: (v: ComponentSelectorObject) => void;
}

const ENTITY_TYPES = ['polymer', 'non-polymer', 'water', 'branched'] as const;
const ENTITY_TYPE_NONE = '__none__';

export function ExpressionPanel({ value, onChange }: ExpressionPanelProps) {
  const set = <K extends keyof ComponentSelectorObject>(
    key: K,
    v: ComponentSelectorObject[K] | undefined
  ) => {
    const next = { ...value };
    if (v === undefined || v === ('' as unknown)) delete next[key];
    else next[key] = v;
    onChange(next);
  };

  return (
    <div className='grid grid-cols-2 gap-3'>
      <div>
        <Label className='text-xs'>label_asym_id</Label>
        <Input
          className='h-8 text-xs'
          placeholder='A'
          value={value.label_asym_id ?? ''}
          onChange={(e) => set('label_asym_id', e.target.value || undefined)}
        />
      </div>
      <div>
        <Label className='text-xs'>auth_asym_id</Label>
        <Input
          className='h-8 text-xs'
          placeholder='A'
          value={value.auth_asym_id ?? ''}
          onChange={(e) => set('auth_asym_id', e.target.value || undefined)}
        />
      </div>
      <div>
        <Label className='text-xs'>label_comp_id</Label>
        <Input
          className='h-8 text-xs'
          placeholder='HEC'
          value={value.label_comp_id ?? ''}
          onChange={(e) => set('label_comp_id', e.target.value.toUpperCase() || undefined)}
        />
      </div>
      <div>
        <Label className='text-xs'>entity_type</Label>
        <Select
          value={value.entity_type ?? ENTITY_TYPE_NONE}
          onValueChange={(v) => set('entity_type', v === ENTITY_TYPE_NONE ? undefined : v)}
        >
          <SelectTrigger className='h-8 text-xs'>
            <SelectValue placeholder='Any' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ENTITY_TYPE_NONE}>Any</SelectItem>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className='text-xs'>label_seq_id</Label>
        <NumericInput
          className='h-8 text-xs no-spinners'
          value={value.label_seq_id}
          onChange={(v) => set('label_seq_id', v)}
        />
      </div>
      <div>
        <Label className='text-xs'>auth_seq_id</Label>
        <NumericInput
          className='h-8 text-xs no-spinners'
          value={value.auth_seq_id}
          onChange={(v) => set('auth_seq_id', v)}
        />
      </div>
      <div>
        <Label className='text-xs'>beg_label_seq_id</Label>
        <NumericInput
          className='h-8 text-xs no-spinners'
          value={value.beg_label_seq_id}
          onChange={(v) => set('beg_label_seq_id', v)}
        />
      </div>
      <div>
        <Label className='text-xs'>end_label_seq_id</Label>
        <NumericInput
          className='h-8 text-xs no-spinners'
          value={value.end_label_seq_id}
          onChange={(v) => set('end_label_seq_id', v)}
        />
      </div>
    </div>
  );
}
