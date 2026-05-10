import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';

interface CanvasFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function CanvasFields({ params, onChange }: CanvasFieldsProps) {
  const bgColor = (params.background_color as string) || '';
  const hexValue = bgColor.startsWith('#') ? bgColor : '#ffffff';

  return (
    <div className='flex-1'>
      <Label className='text-xs'>Background color</Label>
      <div className='flex gap-1'>
        <input
          type='color'
          className='h-8 w-8 rounded border border-input cursor-pointer p-0.5 shrink-0'
          value={hexValue}
          onChange={(e) => onChange({ ...params, background_color: e.target.value })}
          title='Pick background color'
        />
        <Input
          className='h-8 text-sm'
          placeholder='#ffffff or white'
          value={bgColor}
          onChange={(e) => onChange({ ...params, background_color: e.target.value })}
        />
      </div>
    </div>
  );
}
