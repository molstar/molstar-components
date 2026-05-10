import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx';

interface AnimationFieldsProps {
  animType: string;
  params: string;
  onAnimTypeChange: (value: string) => void;
  onParamsChange: (value: string) => void;
}

export function AnimationFields({ animType, params, onAnimTypeChange, onParamsChange }: AnimationFieldsProps) {
  return (
    <>
      <div className='flex-1'>
        <Label className='text-xs'>Type</Label>
        <Select value={animType} onValueChange={onAnimTypeChange}>
          <SelectTrigger size='sm'>
            <SelectValue placeholder='Select' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='spin'>Spin</SelectItem>
            <SelectItem value='interpolate'>Interpolate</SelectItem>
            <SelectItem value='camera'>Camera</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='flex-1'>
        <Label className='text-xs'>Parameters</Label>
        <Input
          className='h-8 text-sm'
          placeholder='e.g., speed: 0.05'
          value={params}
          onChange={(e) => onParamsChange(e.target.value)}
        />
      </div>
    </>
  );
}
