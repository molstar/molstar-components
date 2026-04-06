import { Label } from '../../base/label.tsx';
import { Textarea } from '../../base/textarea.tsx';
import type { RawPanelProps } from './types.ts';

export function RawPanel({ value, error, onChange }: RawPanelProps) {
  return (
    <div className='space-y-2'>
      <Label className='text-sm'>Animation JSON</Label>
      <Textarea
        className='min-h-[300px] font-mono text-xs'
        placeholder={`{
  "autoplay": true,
  "loop": true,
  "steps": [
    {
      "kind": "scalar",
      "target_ref": "myLabel",
      "property": "label_opacity",
      "start": 0,
      "end": 1,
      "duration_ms": 1000
    }
  ]
}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className='text-xs text-destructive'>{error}</p>}
      <p className='text-xs text-muted-foreground'>
        Paste full AnimationParams JSON. Steps array with kind, target_ref, property, start, end, duration_ms.
      </p>
    </div>
  );
}
