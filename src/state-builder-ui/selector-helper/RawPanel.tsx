'use client';

import { Label } from '../ui/label.tsx';

interface RawPanelProps {
  value: string;
  error: string;
  onChange: (value: string) => void;
}

export function RawPanel({ value, error, onChange }: RawPanelProps) {
  return (
    <div>
      <Label className='text-sm'>Raw Selector Expression</Label>
      <textarea
        className='w-full h-24 mt-2 p-2 text-sm font-mono border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring'
        placeholder='{ "label_asym_id": "A" }'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className='text-xs text-destructive mt-1'>{error}</p>}
      <p className='text-xs text-muted-foreground mt-1'>
        Enter JSON object or string selector (e.g., &quot;all&quot;, &quot;polymer&quot;)
      </p>
    </div>
  );
}
