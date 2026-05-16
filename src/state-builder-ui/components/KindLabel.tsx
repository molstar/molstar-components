'use client';

import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import { MVS_KIND_LABELS } from '../../state-builder/index.ts';
import { getColorForKind } from '../node-categories.ts';
import { cn } from '../lib/utils.ts';

interface KindLabelProps {
  value: MVSKind | '';
  className?: string;
}

export function KindLabel({ value, className }: KindLabelProps) {
  const dotColor = getColorForKind(value);
  const label = value ? (MVS_KIND_LABELS[value as MVSKind] ?? value) : '—';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 py-1 px-2 text-xs font-semibold text-muted-foreground min-w-[90px]',
        className
      )}
    >
      <span
        className='inline-block rounded-full shrink-0'
        style={{ width: 7, height: 7, background: dotColor }}
      />
      <span className='truncate'>{label}</span>
    </span>
  );
}
