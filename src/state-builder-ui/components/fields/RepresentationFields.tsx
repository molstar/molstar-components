import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx';
import { REPRESENTATION_TYPES, getActiveValues } from '@molstar/state-builder';

interface RepresentationFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function RepresentationFields({ params, onChange }: RepresentationFieldsProps) {
  const type = (params.type as string) || '';
  const sizeFactor = params.size_factor as number | undefined;
  const activeTypes = getActiveValues(REPRESENTATION_TYPES);

  return (
    <>
      <div className='flex-1'>
        <Label className='text-xs'>Type</Label>
        <Select value={type} onValueChange={(value) => onChange({ ...params, type: value })}>
          <SelectTrigger size='sm'>
            <SelectValue placeholder='Select' />
          </SelectTrigger>
          <SelectContent>
            {activeTypes.map((rep) => (
              <SelectItem key={rep.value} value={rep.value}>
                {rep.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='w-20'>
        <Label className='text-xs'>Size factor</Label>
        <Input
          className='h-8 text-sm'
          type='number'
          step='0.1'
          min='0'
          placeholder='1'
          value={sizeFactor ?? ''}
          onChange={(e) => {
            const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
            const next = { ...params };
            if (v === undefined) delete next.size_factor;
            else next.size_factor = v;
            onChange(next);
          }}
        />
      </div>
    </>
  );
}
