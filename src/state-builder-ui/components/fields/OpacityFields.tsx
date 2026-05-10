import { Label } from '../../ui/label.tsx';
import { NumericInput } from '../NumericInput.tsx';

interface OpacityFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function OpacityFields({ params, onChange }: OpacityFieldsProps) {
  const opacity = (params.opacity as number) ?? 1.0;
  const pct = Math.round(opacity * 100);

  const handleNumericChange = (v: number | undefined) => {
    const clamped = Math.min(1, Math.max(0, v ?? 1));
    onChange({ ...params, opacity: clamped });
  };

  return (
    <>
      <div className='flex-1 min-w-[80px]'>
        <Label className='text-xs'>Opacity</Label>
        <input
          type='range'
          min='0'
          max='100'
          step='1'
          value={pct}
          onChange={(e) => onChange({ ...params, opacity: parseInt(e.target.value) / 100 })}
          className='w-full mt-2 accent-primary cursor-pointer h-8'
          title={`Opacity: ${opacity.toFixed(2)}`}
        />
      </div>
      <div className='w-16'>
        <Label className='text-xs'>&nbsp;</Label>
        <NumericInput
          className='h-8 text-xs no-spinners'
          value={Math.round(opacity * 100) / 100}
          onChange={handleNumericChange}
          placeholder='1'
        />
      </div>
    </>
  );
}
