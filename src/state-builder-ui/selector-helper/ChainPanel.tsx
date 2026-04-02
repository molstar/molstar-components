'use client';

import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { Label } from '../ui/label.tsx';
import type { LabeledOption } from './types.ts';

interface ChainPanelProps {
  selectedChain: string;
  onChainChange: (chain: string) => void;
  availableChains: LabeledOption[];
}

export function ChainPanel({ selectedChain, onChainChange, availableChains }: ChainPanelProps) {
  return (
    <div>
      <Label className='text-sm'>Select Chain</Label>
      <div className='flex flex-wrap gap-2 mt-2'>
        {availableChains.map((chain) => (
          <Button
            key={chain.value}
            size='sm'
            variant={selectedChain === chain.value ? 'default' : 'outline'}
            onClick={() => onChainChange(chain.value)}
            className='w-10'
            title={chain.description}
          >
            {chain.label}
          </Button>
        ))}
      </div>
      <div className='mt-3'>
        <Label className='text-xs text-muted-foreground'>Or enter custom chain ID:</Label>
        <Input
          className='h-8 text-sm mt-1'
          placeholder='e.g., A'
          value={selectedChain}
          onChange={(e) => onChainChange(e.target.value.toUpperCase())}
        />
      </div>
    </div>
  );
}
