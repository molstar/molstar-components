import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import type { SimplePanelProps } from './types.ts';

export function SimplePanel({ color, onChange }: SimplePanelProps) {
  return (
    <div className='flex gap-2 items-end pt-2'>
      <div className='flex-1'>
        <Label className='text-xs'>Color value</Label>
        <Input
          className='h-8 text-sm'
          placeholder='e.g., #4577B2 or red'
          value={color}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <input
        type='color'
        className='w-9 h-8 rounded border border-gray-300 cursor-pointer p-0 shrink-0'
        value={color.startsWith('#') ? color : '#808080'}
        onChange={(e) => onChange(e.target.value)}
        title='Pick color'
      />
    </div>
  );
}
