import { Label } from '../ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.tsx';
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';

interface TypeSelectProps {
  value: MVSKind | '';
  onChange: (kind: MVSKind) => void;
}

/**
 * Operation type selector dropdown
 */
export function TypeSelect({ value, onChange }: TypeSelectProps) {
  return (
    <div className='w-32'>
      <Label className='text-xs'>Type</Label>
      <Select value={value} onValueChange={onChange as (value: string) => void}>
        <SelectTrigger size='sm'>
          <SelectValue placeholder='Select' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='constant'>Constant</SelectItem>
          <SelectItem value='download'>Download</SelectItem>
          <SelectItem value='parse'>Parse</SelectItem>
          <SelectItem value='structure'>Structure</SelectItem>
          <SelectItem value='component'>Component</SelectItem>
          <SelectItem value='representation'>Representation</SelectItem>
          <SelectItem value='color'>Color</SelectItem>
          <SelectItem value='transform'>Transform</SelectItem>
          <SelectItem value='label'>Label</SelectItem>
          <SelectItem value='primitives'>Primitives</SelectItem>
          <SelectItem value='animation'>Animation</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
