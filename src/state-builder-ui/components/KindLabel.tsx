'use client';

import { Select, SelectContent, SelectItem, SelectTrigger } from '../base/select.tsx';
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import {
  MVS_KIND_LABELS,
  MVS_SELECTABLE_KINDS,
} from '../../state-builder/index.ts';
import type { UINode } from '../../state-builder/index.ts';
import { DOWNLOAD_PARSE_SEQUENCE, createDownloadParseNodes } from '../../state-builder/index.ts';
import { getColorForKind } from '../node-categories.ts';
import { cn } from '../lib/utils.ts';

interface KindLabelProps {
  value: MVSKind | '';
  onChange?: (kind: MVSKind) => void;
  onCompositeSelect?: (node: UINode) => void;
  allowedKinds?: readonly (MVSKind | string)[];
  className?: string;
}

export function KindLabel({ value, onChange, onCompositeSelect, allowedKinds, className }: KindLabelProps) {
  // When a kind is already set, show a plain label.
  if (value) {
    const dotColor = getColorForKind(value);
    const label = MVS_KIND_LABELS[value as MVSKind] ?? value;
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

  // No kind yet — show a select if onChange is provided.
  if (!onChange) {
    return (
      <span className={cn('inline-flex items-center gap-1 py-1 px-2 text-xs font-semibold text-muted-foreground min-w-[90px]', className)}>
        <span className='inline-block rounded-full shrink-0' style={{ width: 7, height: 7, background: getColorForKind('') }} />
        <span className='truncate'>—</span>
      </span>
    );
  }

  const kindsToShow = (allowedKinds ?? MVS_SELECTABLE_KINDS).filter((k) => k !== 'camera');
  const showCompositeOption = kindsToShow.includes('download');
  const regularKinds = showCompositeOption
    ? kindsToShow.filter((k) => k !== 'download' && k !== 'parse')
    : kindsToShow;

  const handleChange = (selectedValue: string) => {
    if (selectedValue === DOWNLOAD_PARSE_SEQUENCE.selectValue) {
      onCompositeSelect?.(createDownloadParseNodes());
    } else {
      onChange(selectedValue as MVSKind);
    }
  };

  return (
    <Select value='' onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          'h-auto py-1 px-2 border-transparent bg-transparent shadow-none gap-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:border-border transition-colors min-w-[90px] focus:ring-0 focus:ring-offset-0',
          className
        )}
      >
        <span className='truncate text-muted-foreground/60 italic'>select kind…</span>
      </SelectTrigger>
      <SelectContent>
        {showCompositeOption && (
          <SelectItem value={DOWNLOAD_PARSE_SEQUENCE.selectValue}>
            {DOWNLOAD_PARSE_SEQUENCE.label}
          </SelectItem>
        )}
        {regularKinds.map((kind) => (
          <SelectItem key={kind} value={kind}>
            {MVS_KIND_LABELS[kind as MVSKind] ?? kind}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
