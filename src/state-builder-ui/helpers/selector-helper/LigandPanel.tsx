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
import type { LabeledOption } from './types.ts';

interface LigandPanelProps {
  ligandName: string;
  ligandChain: string;
  onNameChange: (name: string) => void;
  onChainChange: (chain: string) => void;
  availableLigands: LabeledOption[];
  availableChains: LabeledOption[];
  hasMetadataLigands: boolean;
}

export function LigandPanel({
  ligandName,
  ligandChain,
  onNameChange,
  onChainChange,
  availableLigands,
  availableChains,
  hasMetadataLigands,
}: LigandPanelProps) {
  return (
    <div className='space-y-3'>
      <div>
        <Label className='text-sm'>
          {hasMetadataLigands ? 'Ligands in Structure' : 'Common Ligands'}
        </Label>
        <div className='flex flex-wrap gap-2 mt-2'>
          {availableLigands.map((lig) => (
            <Button
              key={lig.value}
              size='sm'
              variant={ligandName === lig.value ? 'default' : 'outline'}
              onClick={() => onNameChange(lig.value)}
              title={lig.description}
            >
              {lig.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <Label className='text-sm'>Or enter ligand name:</Label>
        <Input
          className='h-8 text-sm mt-1'
          placeholder='e.g., HEM, ATP, NAD'
          value={ligandName}
          onChange={(e) => onNameChange(e.target.value.toUpperCase())}
        />
      </div>
      <div>
        <Label className='text-sm'>Chain (optional)</Label>
        <Select
          value={ligandChain || 'none'}
          onValueChange={(val) => onChainChange(val === 'none' ? '' : val)}
        >
          <SelectTrigger size='sm' className='mt-1'>
            <SelectValue placeholder='All chains' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>All chains</SelectItem>
            {availableChains.map((chain) => (
              <SelectItem key={chain.value} value={chain.value}>
                Chain {chain.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
