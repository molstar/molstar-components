import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';

interface VolumeFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function VolumeFields({ params, onChange }: VolumeFieldsProps) {
  const channelId = (params.channel_id as string) ?? '';

  return (
    <div className='w-32'>
      <Label className='text-xs'>Channel ID</Label>
      <Input
        className='h-8 text-sm'
        placeholder='e.g. 2FO-FC'
        value={channelId}
        onChange={(e) => {
          const next = { ...params };
          if (e.target.value === '') delete next.channel_id;
          else next.channel_id = e.target.value;
          onChange(next);
        }}
      />
    </div>
  );
}
