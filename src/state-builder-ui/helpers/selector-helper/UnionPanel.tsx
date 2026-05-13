'use client';

import { Button } from '../../base/button.tsx';
import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import { PlusIcon, XIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../base/select.tsx';
import type { LabeledValue } from '../../../state-builder/index.ts';
import type { UnionEntry } from './types.ts';

interface UnionPanelProps {
  entries: UnionEntry[];
  onChange: (entries: UnionEntry[]) => void;
  availableChains: LabeledValue[];
}

export function UnionPanel({ entries, onChange, availableChains }: UnionPanelProps) {
  const updateEntry = (id: string, patch: Partial<UnionEntry>) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const addEntry = () => {
    onChange([...entries, { id: `${Date.now()}`, chain: '', from: '', to: '' }]);
  };

  const removeEntry = (id: string) => {
    onChange(entries.filter((e) => e.id !== id));
  };

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        {entries.map((entry, idx) => (
          <div key={entry.id} className='flex gap-2 items-end border rounded-md p-2'>
            <span className='text-xs text-muted-foreground w-4 pb-1'>{idx + 1}.</span>

            {/* Chain */}
            <div className='flex-1'>
              <Label className='text-[10px] text-muted-foreground'>Chain</Label>
              {availableChains.length > 0 ? (
                <Select value={entry.chain} onValueChange={(v) => updateEntry(entry.id, { chain: v })}>
                  <SelectTrigger className='h-8 text-xs'>
                    <SelectValue placeholder='Select...' />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChains.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className='h-8 text-xs'
                  placeholder='A'
                  value={entry.chain}
                  onChange={(e) => updateEntry(entry.id, { chain: e.target.value.toUpperCase() })}
                />
              )}
            </div>

            {/* Residue from */}
            <div className='w-16'>
              <Label className='text-[10px] text-muted-foreground'>From</Label>
              <Input
                className='h-8 text-xs'
                type='number'
                placeholder='—'
                value={entry.from}
                onChange={(e) => updateEntry(entry.id, { from: e.target.value })}
              />
            </div>

            {/* Residue to */}
            <div className='w-16'>
              <Label className='text-[10px] text-muted-foreground'>To</Label>
              <Input
                className='h-8 text-xs'
                type='number'
                placeholder='—'
                value={entry.to}
                onChange={(e) => updateEntry(entry.id, { to: e.target.value })}
              />
            </div>

            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8 shrink-0 text-destructive'
              onClick={() => removeEntry(entry.id)}
              disabled={entries.length === 1}
            >
              <XIcon className='size-3.5' />
            </Button>
          </div>
        ))}
      </div>

      <Button size='sm' variant='outline' onClick={addEntry} className='w-full'>
        <PlusIcon className='size-3.5 mr-1' /> Add selector
      </Button>

      <p className='text-xs text-muted-foreground'>
        Each row is one selector in the union array. Chain is required; residue range is optional.
      </p>
    </div>
  );
}
