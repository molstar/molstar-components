import { Label } from '../../ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx';
import { Switch } from '../../ui/switch.tsx';
import { NumericInput } from '../NumericInput.tsx';
import { VOLUME_REPRESENTATION_TYPES } from '../../../state-builder/index.ts';

interface VolumeRepresentationFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function VolumeRepresentationFields({ params, onChange }: VolumeRepresentationFieldsProps) {
  const type = (params.type as string) || '';

  const handleTypeChange = (newType: string) => {
    onChange({ type: newType });
  };

  const set = (key: string, value: unknown) => {
    const next = { ...params };
    if (value === undefined || value === null) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  return (
    <>
      <div className='w-36'>
        <Label className='text-xs'>Type</Label>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger size='sm'>
            <SelectValue placeholder='Select' />
          </SelectTrigger>
          <SelectContent>
            {VOLUME_REPRESENTATION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === 'isosurface' && (
        <>
          <div className='w-24'>
            <Label className='text-xs'>Rel. isovalue</Label>
            <NumericInput
              value={params.relative_isovalue as number | undefined}
              onChange={(v) => set('relative_isovalue', v)}
              placeholder='e.g. 1.5'
            />
          </div>
          <div className='w-24'>
            <Label className='text-xs'>Abs. isovalue</Label>
            <NumericInput
              value={params.absolute_isovalue as number | undefined}
              onChange={(v) => set('absolute_isovalue', v)}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>Wireframe</Label>
            <Switch
              checked={!!(params.show_wireframe as boolean)}
              onCheckedChange={(v) => set('show_wireframe', v || undefined)}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>Faces</Label>
            <Switch
              checked={(params.show_faces as boolean) ?? true}
              onCheckedChange={(v) => set('show_faces', v ? undefined : false)}
            />
          </div>
        </>
      )}

      {type === 'grid_slice' && (
        <>
          <div className='w-20'>
            <Label className='text-xs'>Dimension</Label>
            <Select
              value={(params.dimension as string) || 'x'}
              onValueChange={(v) => set('dimension', v)}
            >
              <SelectTrigger size='sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='x'>X</SelectItem>
                <SelectItem value='y'>Y</SelectItem>
                <SelectItem value='z'>Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='w-24'>
            <Label className='text-xs'>Rel. index</Label>
            <NumericInput
              value={params.relative_index as number | undefined}
              onChange={(v) => set('relative_index', v)}
              placeholder='0–1'
            />
          </div>
          <div className='w-24'>
            <Label className='text-xs'>Abs. index</Label>
            <NumericInput
              value={params.absolute_index as number | undefined}
              onChange={(v) => set('absolute_index', v)}
            />
          </div>
          <div className='w-24'>
            <Label className='text-xs'>Rel. isovalue</Label>
            <NumericInput
              value={params.relative_isovalue as number | undefined}
              onChange={(v) => set('relative_isovalue', v)}
            />
          </div>
          <div className='w-24'>
            <Label className='text-xs'>Abs. isovalue</Label>
            <NumericInput
              value={params.absolute_isovalue as number | undefined}
              onChange={(v) => set('absolute_isovalue', v)}
            />
          </div>
        </>
      )}
    </>
  );
}
