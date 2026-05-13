import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx';
import { STRUCTURE_TYPES, getActiveValues } from '../../../state-builder/index.ts';

interface StructureFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

function parseIjk(v: unknown): [number, number, number] {
  if (Array.isArray(v) && v.length === 3) return v as [number, number, number];
  return [0, 0, 0];
}

function IjkInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: [number, number, number];
  onChange: (v: [number, number, number]) => void;
}) {
  return (
    <div>
      <Label className='text-xs'>{label}</Label>
      <div className='flex gap-1 mt-1'>
        {(['i', 'j', 'k'] as const).map((axis, idx) => (
          <Input
            key={axis}
            className='h-8 text-xs font-mono w-14'
            type='number'
            step='1'
            placeholder={axis}
            value={value[idx]}
            onChange={(e) => {
              const next = [...value] as [number, number, number];
              next[idx] = parseInt(e.target.value) || 0;
              onChange(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function StructureFields({ params, onChange }: StructureFieldsProps) {
  const type = (params.type as string) || '';
  const activeTypes = getActiveValues(STRUCTURE_TYPES);

  return (
    <div className='flex flex-1 gap-3 flex-wrap items-end'>
      {/* Type */}
      <div className='w-36'>
        <Label className='text-xs'>Type</Label>
        <Select
          value={type}
          onValueChange={(value) => {
            // Drop type-specific params when switching type
            const { assembly_id: _a, radius: _r, ijk_min: _im, ijk_max: _ix, ...rest } = params;
            onChange({ ...rest, type: value });
          }}
        >
          <SelectTrigger size='sm'>
            <SelectValue placeholder='Select' />
          </SelectTrigger>
          <SelectContent>
            {activeTypes.map((st) => (
              <SelectItem key={st.value} value={st.value}>
                {st.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assembly ID — assembly only */}
      {type === 'assembly' && (
        <div className='w-24'>
          <Label className='text-xs'>Assembly ID</Label>
          <Input
            className='h-8 text-sm mt-1'
            placeholder='1'
            value={typeof params.assembly_id === 'string' ? params.assembly_id : ''}
            onChange={(e) =>
              onChange({ ...params, assembly_id: e.target.value || undefined })
            }
          />
        </div>
      )}

      {/* Radius — symmetry_mates only */}
      {type === 'symmetry_mates' && (
        <div className='w-20'>
          <Label className='text-xs'>Radius (Å)</Label>
          <Input
            className='h-8 text-sm font-mono mt-1'
            type='number'
            step='1'
            min='0'
            placeholder='5'
            value={typeof params.radius === 'number' ? params.radius : ''}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
              const next = { ...params };
              if (v === undefined) delete next.radius;
              else next.radius = v;
              onChange(next);
            }}
          />
        </div>
      )}

      {/* IJK min/max — symmetry only */}
      {type === 'symmetry' && (
        <>
          <IjkInput
            label='IJK Min'
            value={parseIjk(params.ijk_min)}
            onChange={(v) => onChange({ ...params, ijk_min: v })}
          />
          <IjkInput
            label='IJK Max'
            value={parseIjk(params.ijk_max)}
            onChange={(v) => onChange({ ...params, ijk_max: v })}
          />
        </>
      )}

      {/* Model index — all types */}
      <div className='w-20'>
        <Label className='text-xs'>Model Index</Label>
        <Input
          className='h-8 text-sm font-mono mt-1'
          type='number'
          step='1'
          min='0'
          placeholder='0'
          value={typeof params.model_index === 'number' ? params.model_index : ''}
          onChange={(e) => {
            const v = e.target.value === '' ? undefined : parseInt(e.target.value);
            const next = { ...params };
            if (v === undefined) delete next.model_index;
            else next.model_index = v;
            onChange(next);
          }}
        />
      </div>

      {/* Block index — all types */}
      <div className='w-20'>
        <Label className='text-xs'>Block Index</Label>
        <Input
          className='h-8 text-sm font-mono mt-1'
          type='number'
          step='1'
          min='0'
          placeholder='0'
          value={typeof params.block_index === 'number' ? params.block_index : ''}
          onChange={(e) => {
            const v = e.target.value === '' ? undefined : parseInt(e.target.value);
            const next = { ...params };
            if (v === undefined) delete next.block_index;
            else next.block_index = v;
            onChange(next);
          }}
        />
      </div>

      {/* Block header — all types */}
      <div className='w-32'>
        <Label className='text-xs'>Block Header</Label>
        <Input
          className='h-8 text-sm mt-1'
          placeholder='optional'
          value={typeof params.block_header === 'string' ? params.block_header : ''}
          onChange={(e) =>
            onChange({ ...params, block_header: e.target.value || undefined })
          }
        />
      </div>

      {/* Coordinates ref — all types */}
      <div className='w-28'>
        <Label className='text-xs'>Coords Ref</Label>
        <Input
          className='h-8 text-sm mt-1'
          placeholder='optional'
          value={typeof params.coordinates_ref === 'string' ? params.coordinates_ref : ''}
          onChange={(e) =>
            onChange({ ...params, coordinates_ref: e.target.value || undefined })
          }
        />
      </div>
    </div>
  );
}
