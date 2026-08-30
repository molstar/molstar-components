'use client';

import type { ReactNode } from 'react';
import { Label } from '../base/label.tsx';
import { Textarea } from '../base/textarea.tsx';

interface RawJsonPanelProps {
  value: string;
  error: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Omit when the panel is already inside a tab/section titled "Raw" — avoids a redundant label. */
  label?: string;
  helpText?: ReactNode;
  /** e.g. '160px', '6rem', '300px'. Defaults to '160px'. */
  minHeight?: string;
}

export function RawJsonPanel({ value, error, onChange, placeholder, label, helpText, minHeight }: RawJsonPanelProps) {
  return (
    <div className='space-y-2'>
      {label && <Label className='text-sm'>{label}</Label>}
      <Textarea
        className='font-mono text-xs resize-y'
        style={{ minHeight: minHeight ?? '160px' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={placeholder}
      />
      {error && <p className='text-xs text-destructive'>{error}</p>}
      {helpText && <p className='text-xs text-muted-foreground'>{helpText}</p>}
    </div>
  );
}
