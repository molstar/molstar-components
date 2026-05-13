'use client';

import { Label } from '../../base/label.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { isValidRotationMatrix } from '../../../state-builder/index.ts';
import type { RotationMatrixPanelProps } from './types.ts';

export function RotationMatrixPanel({ matrix, onChange }: RotationMatrixPanelProps) {
  const valid = isValidRotationMatrix(matrix);

  const handleCellChange = (idx: number, num: number) => {
    const next = [...matrix];
    next[idx] = num;
    onChange(next);
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <Label className='text-sm'>3x3 Rotation Matrix</Label>
        {matrix.some(v => v !== 0) && (
          <span className={`text-xs ${valid ? 'text-green-600' : 'text-amber-600'}`}>
            {valid ? 'Valid rotation' : 'Not a valid rotation matrix'}
          </span>
        )}
      </div>

      {/* 3x3 grid with bracket styling — values in flat array order (matching code) */}
      <div className='flex items-center gap-1'>
        <div className='border-l-2 border-t-2 border-b-2 border-foreground/30 w-1.5 self-stretch rounded-l-sm' />
        <div className='grid grid-cols-3 gap-1 flex-1'>
          {matrix.map((val, idx) => (
            <NumericInput
              key={idx}
              className='h-8 text-xs font-mono text-center no-spinners'
              value={parseFloat(val.toFixed(6))}
              onChange={(v) => { if (v !== undefined) handleCellChange(idx, v); }}
              title={`[${idx}]`}
            />
          ))}
        </div>
        <div className='border-r-2 border-t-2 border-b-2 border-foreground/30 w-1.5 self-stretch rounded-r-sm' />
      </div>

      <p className='text-xs text-muted-foreground'>
        Values in flat array order, matching code representation.
      </p>
    </div>
  );
}
