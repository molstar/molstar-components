import { Label } from '../ui/label.tsx';
import { Textarea } from '../ui/textarea.tsx';

interface RawPanelProps {
  value: string;
  error: string;
  onChange: (v: string) => void;
}

export function RawPanel({ value, error, onChange }: RawPanelProps) {
  return (
    <div className='space-y-2'>
      <Label className='text-sm'>Primitives JSON</Label>
      <Textarea
        className='min-h-[300px] font-mono text-xs'
        placeholder={`[
  {
    "kind": "label",
    "position": [0, 0, 0],
    "text": "Label"
  }
]`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className='text-xs text-destructive'>{error}</p>}
      <p className='text-xs text-muted-foreground'>
        Paste full primitives array JSON. Each object must include a <code>kind</code> field.
      </p>
    </div>
  );
}
