'use client';

import { useState } from 'react';
import { ChevronRightIcon, XIcon } from 'lucide-react';
import { Input } from '../base/input.tsx';
import { cn } from '../lib/utils.ts';

export type RemapEntry = { key: string; value: string };

interface FieldRemappingSectionProps {
  entries: RemapEntry[];
  onChange: (entries: RemapEntry[]) => void;
}

export function FieldRemappingSection({ entries, onChange }: FieldRemappingSectionProps) {
  const [open, setOpen] = useState(false);

  const updateEntry = (i: number, patch: Partial<RemapEntry>) => {
    const next = [...entries];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  return (
    <div className='flex flex-col gap-1'>
      <button type='button' className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit' onClick={() => setOpen(o => !o)}>
        <ChevronRightIcon className={cn('size-3 transition-transform', open && 'rotate-90')} />
        Field remapping
        {entries.length > 0 && !open && <span className='text-foreground'>({entries.length})</span>}
      </button>
      {open && (
        <div className='flex flex-col gap-1 pl-4 pt-1'>
          {entries.map((entry, i) => (
            <div key={i} className='flex items-center gap-1'>
              <Input className='h-6 text-xs font-mono flex-1' placeholder='source_field' value={entry.key} onChange={(e) => updateEntry(i, { key: e.target.value })} />
              <span className='text-xs text-muted-foreground'>→</span>
              <Input className='h-6 text-xs font-mono flex-1' placeholder='target_field' value={entry.value} onChange={(e) => updateEntry(i, { value: e.target.value })} />
              <button type='button' className='text-muted-foreground hover:text-destructive' onClick={() => onChange(entries.filter((_, j) => j !== i))}>
                <XIcon className='size-3' />
              </button>
            </div>
          ))}
          <button type='button' className='text-xs text-muted-foreground hover:text-foreground w-fit' onClick={() => onChange([...entries, { key: '', value: '' }])}>
            + Add mapping
          </button>
        </div>
      )}
    </div>
  );
}
