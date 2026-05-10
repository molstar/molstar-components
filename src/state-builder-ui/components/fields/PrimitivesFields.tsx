import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';

interface PrimitivesFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function PrimitivesFields({ params, onChange }: PrimitivesFieldsProps) {
  const color = (params.color as string) ?? '';
  const colorHex = color.startsWith('#') ? color : '#ffffff';

  return (
    <div className='flex flex-1 gap-3 flex-wrap items-end'>
      {/* Color */}
      <div>
        <Label className='text-xs'>Color</Label>
        <div className='flex gap-1'>
          <input
            type='color'
            className='h-8 w-8 rounded border border-input cursor-pointer p-0.5 shrink-0'
            value={colorHex}
            onChange={(e) => onChange({ ...params, color: e.target.value })}
            title='Pick color'
          />
          <Input
            className='h-8 text-sm w-24'
            placeholder='#ffffff or name'
            value={color}
            onChange={(e) => onChange({ ...params, color: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* Opacity */}
      <div className='w-20'>
        <Label className='text-xs'>Opacity</Label>
        <Input
          className='h-8 text-sm font-mono'
          type='number'
          step='0.05'
          min='0'
          max='1'
          placeholder='1'
          value={typeof params.opacity === 'number' ? params.opacity : ''}
          onChange={(e) => {
            const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
            const next = { ...params };
            if (v === undefined) delete next.opacity;
            else next.opacity = v;
            onChange(next);
          }}
        />
      </div>

      {/* Label color */}
      <div className='w-28'>
        <Label className='text-xs'>Label Color</Label>
        <Input
          className='h-8 text-sm'
          placeholder='inherit'
          value={typeof params.label_color === 'string' ? params.label_color : ''}
          onChange={(e) => onChange({ ...params, label_color: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
