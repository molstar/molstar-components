'use client';

import { Button } from '../../base/button.tsx';
import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../base/select.tsx';
import type { StructureMetadata } from '../../../state-builder/index.ts';
import type { LabeledOption } from './types.ts';

interface ResiduePanelProps {
  chain: string;
  from: string;
  to: string;
  onChainChange: (chain: string) => void;
  onFromChange: (from: string) => void;
  onToChange: (to: string) => void;
  availableChains: LabeledOption[];
  metadata?: StructureMetadata | null;
}

/** Format chain label with residue range if available */
function formatChainLabel(chainId: string, metadata?: StructureMetadata | null): string {
  const range = metadata?.residueRanges?.[chainId];
  if (range) {
    return `Chain ${chainId} (${range.min}–${range.max})`;
  }
  return `Chain ${chainId}`;
}

export function ResiduePanel({
  chain,
  from,
  to,
  onChainChange,
  onFromChange,
  onToChange,
  availableChains,
  metadata,
}: ResiduePanelProps) {
  // Get residue range for selected chain
  const residueRange = chain ? metadata?.residueRanges?.[chain] : undefined;
  const minResidue = residueRange?.min;
  const maxResidue = residueRange?.max;

  const handleSelectFullRange = () => {
    if (minResidue !== undefined && maxResidue !== undefined) {
      onFromChange(String(minResidue));
      onToChange(String(maxResidue));
    }
  };

  return (
    <div className='space-y-3'>
      <div>
        <Label className='text-sm'>Chain</Label>
        <Select value={chain} onValueChange={onChainChange}>
          <SelectTrigger size='sm' className='mt-1'>
            <SelectValue placeholder='Select chain' />
          </SelectTrigger>
          <SelectContent>
            {availableChains.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {formatChainLabel(c.value, metadata)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className='h-8 text-sm mt-2'
          placeholder='Or enter custom chain ID'
          value={chain}
          onChange={(e) => onChainChange(e.target.value.toUpperCase())}
        />
      </div>

      {/* Residue range info with quick select */}
      {residueRange && (
        <div className='flex items-center justify-between gap-2 text-xs bg-muted/50 px-2 py-1.5 rounded border'>
          <span className='text-muted-foreground'>
            Valid range: <strong className='text-foreground'>{minResidue}–{maxResidue}</strong>
          </span>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-6 px-2 text-xs'
            onClick={handleSelectFullRange}
          >
            Select full range
          </Button>
        </div>
      )}

      <div className='grid grid-cols-2 gap-2'>
        <div>
          <Label className='text-sm'>From Residue</Label>
          <Input
            className='h-8 text-sm mt-1'
            type='number'
            placeholder={minResidue !== undefined ? String(minResidue) : 'e.g., 10'}
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            min={minResidue}
            max={maxResidue}
          />
        </div>
        <div>
          <Label className='text-sm'>To Residue (optional)</Label>
          <Input
            className='h-8 text-sm mt-1'
            type='number'
            placeholder={maxResidue !== undefined ? String(maxResidue) : 'e.g., 50'}
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            min={minResidue}
            max={maxResidue}
          />
        </div>
      </div>

      <p className='text-xs text-muted-foreground'>
        Leave &quot;To&quot; empty to select a single residue
      </p>
    </div>
  );
}
