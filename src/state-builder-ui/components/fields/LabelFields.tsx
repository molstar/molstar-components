import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';

interface LabelFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function LabelFields({ params, onChange }: LabelFieldsProps) {
  const text = (params.text as string) || '';

  return (
    <div className='flex-1'>
      <Label className='text-xs'>Text</Label>
      <Input
        className='h-8 text-sm'
        placeholder='Label text'
        value={text}
        onChange={(e) => onChange({ ...params, text: e.target.value })}
      />
    </div>
  );
}
