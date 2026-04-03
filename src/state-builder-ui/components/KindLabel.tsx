'use client';

import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select.tsx';
import { ChevronDownIcon } from 'lucide-react';
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import {
  MVS_KIND_LABELS,
  MVS_SELECTABLE_KINDS,
  DOWNLOAD_PARSE_SEQUENCE,
  UINode,
} from '@molstar/state-builder';
import { createDownloadParseNodes } from '@molstar/state-builder/types/composite-sequences';
import { getColorForKind } from '../node-categories.ts';
import { cn } from '../lib/utils.ts';

interface KindLabelProps {
  value: MVSKind | '';
  onChange: (kind: MVSKind) => void;
  onCompositeSelect?: (node: UINode) => void;
  allowedKinds?: readonly (MVSKind | string)[];
  className?: string;
}

export function KindLabel({ value, onChange, onCompositeSelect, allowedKinds, className }: KindLabelProps) {
  const kindsToShow = (allowedKinds ?? MVS_SELECTABLE_KINDS).filter((k) => k !== 'camera');
  const showCompositeOption = kindsToShow.includes('download');
  const regularKinds = showCompositeOption
    ? kindsToShow.filter((k) => k !== 'download' && k !== 'parse')
    : kindsToShow;

  const handleChange = (selectedValue: string) => {
    if (selectedValue === DOWNLOAD_PARSE_SEQUENCE.selectValue) {
      if (onCompositeSelect) {
        const compositeNode = createDownloadParseNodes();
        onCompositeSelect(compositeNode);
      }
    } else {
      onChange(selectedValue as MVSKind);
    }
  };

  const dotColor = getColorForKind(value);
  const label = value ? (MVS_KIND_LABELS[value as MVSKind] ?? value) : '—';

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          'h-auto py-1 px-2 border-transparent bg-transparent shadow-none gap-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:border-border transition-colors min-w-[90px] focus:ring-0 focus:ring-offset-0',
          className
        )}
      >
        <span
          className='inline-block rounded-full shrink-0'
          style={{ width: 7, height: 7, background: dotColor }}
        />
        <span className='truncate'>{label}</span>
        <ChevronDownIcon className='size-3 shrink-0 text-muted-foreground ml-auto' />
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
