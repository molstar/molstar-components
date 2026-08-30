'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../base/select.tsx';
import { EASING_OPTIONS } from '../../../../state-builder/index.ts';
import type { EasingType } from '../../../../state-builder/index.ts';

export function EasingSelect({
  value,
  onChange,
  className = 'h-7 text-xs',
}: {
  value: EasingType | undefined;
  onChange: (v: EasingType) => void;
  className?: string;
}) {
  return (
    <Select value={value || 'linear'} onValueChange={(v) => onChange(v as EasingType)}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {EASING_OPTIONS.map((e) => (
          <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
