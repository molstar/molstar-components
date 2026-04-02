import { Label } from '../ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.tsx';
import type { ConstantPanelProps } from './types.ts';

export function ConstantPanel({ value, colorConstants, onChange }: ConstantPanelProps) {
  const options = colorConstants.flatMap((c) =>
    c.entries
      .filter((e) => e.key)
      .map((e) => ({
        value: `${c.name}:${e.key}`,
        label: `${c.name}.${e.key}`,
        previewColor: e.value,
      }))
  );

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className='flex flex-col gap-2 pt-2'>
      <div>
        <Label className='text-xs'>Constant Reference</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger size='sm'>
            <SelectValue placeholder='Select constant' />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className='flex items-center gap-2'>
                  <span
                    className='w-3 h-3 rounded-sm border border-gray-300 shrink-0'
                    style={{ backgroundColor: opt.previewColor }}
                  />
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedOption && (
        <div className='flex items-center gap-2'>
          <div
            className='w-6 h-6 rounded border border-gray-300'
            style={{ backgroundColor: selectedOption.previewColor }}
          />
          <span className='text-xs text-muted-foreground'>{selectedOption.label}</span>
        </div>
      )}

      {options.length === 0 && (
        <p className='text-xs text-muted-foreground'>No color constants defined in Constants section.</p>
      )}
    </div>
  );
}
