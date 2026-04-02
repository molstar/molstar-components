'use client';

import { Label } from '../ui/label.tsx';
import { Button } from '../ui/button.tsx';
import { NumericInput } from '../components/NumericInput.tsx';
import { columnToRowMajor4, rowToColumnMajor4, IDENTITY_4x4 } from '@molstar/state-builder';
import type { MatrixPanelProps } from './types.ts';

export function MatrixPanel({ matrix, onChange }: MatrixPanelProps) {
  const active = matrix !== null;
  const displayMatrix = matrix ?? IDENTITY_4x4;
  const rowMajor = columnToRowMajor4(displayMatrix);

  const handleCellChange = (rowMajorIndex: number, num: number) => {
    const newRowMajor = [...rowMajor];
    newRowMajor[rowMajorIndex] = num;
    onChange(rowToColumnMajor4(newRowMajor));
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <Label className='text-sm'>4x4 Transform Matrix</Label>
        {active ? (
          <Button size='sm' variant='outline' onClick={() => onChange(null)}>
            Clear
          </Button>
        ) : (
          <Button size='sm' variant='outline' onClick={() => onChange([...IDENTITY_4x4])}>
            Enable
          </Button>
        )}
      </div>

      {active && (
        <>
          <div className='p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-400'>
            This 4x4 matrix overrides the rotation and translation values.
          </div>

          <div className='flex items-center gap-1'>
            <div className='border-l-2 border-t-2 border-b-2 border-foreground/30 w-1.5 self-stretch rounded-l-sm' />
            <div className='grid grid-cols-4 gap-1 flex-1'>
              {rowMajor.map((val, idx) => (
                <NumericInput
                  key={idx}
                  className='h-7 text-xs font-mono text-center px-1 no-spinners'
                  value={parseFloat(val.toFixed(6))}
                  onChange={(v) => { if (v !== undefined) handleCellChange(idx, v); }}
                  title={`Row ${Math.floor(idx / 4) + 1}, Col ${(idx % 4) + 1}`}
                />
              ))}
            </div>
            <div className='border-r-2 border-t-2 border-b-2 border-foreground/30 w-1.5 self-stretch rounded-r-sm' />
          </div>

          <p className='text-xs text-muted-foreground'>
            Displayed row-by-row. Stored in column-major order per MVS spec.
          </p>
        </>
      )}

      {!active && (
        <p className='text-xs text-muted-foreground'>
          Click &quot;Enable&quot; to use a full 4x4 affine matrix instead of separate rotation/translation.
        </p>
      )}
    </div>
  );
}
