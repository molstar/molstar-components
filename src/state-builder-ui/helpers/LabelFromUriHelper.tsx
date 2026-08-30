'use client';

import type { ReactNode } from 'react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select.tsx';
import type { UINode } from '../../state-builder/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import { useAnnotationUriState } from './annotation-source-state.ts';
import { ANNOTATION_URI_FORMATS, ANNOTATION_URI_SCHEMAS } from '../../state-builder/index.ts';

interface LabelFromUriHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

export function LabelFromUriHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: LabelFromUriHelperProps) {
  const uriState = useAnnotationUriState(node);

  const handleDialogOpen = () => {
    uriState.reset();
  };

  const handleApply = (ref: string) => {
    const params = uriState.applyParams(node.params);
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  const handleRawApply = (params: Record<string, unknown>, ref: string) => {
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  return (
    <NodeHelperBase
      node={node}
      onApply={handleApply}
      onRawApply={handleRawApply}
      onDialogOpen={handleDialogOpen}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      onCustomChange={onCustomChange}
      tabs={[{
        id: 'form', label: 'Label from URI',
        content: (
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>URI</Label>
              <Input className='h-7 text-sm font-mono' placeholder='https://...' value={uriState.uri} onChange={(e) => uriState.setUri(e.target.value)} />
            </div>
            <div className='flex gap-3'>
              <div className='flex flex-col gap-1 flex-1'>
                <Label className='text-xs'>Format</Label>
                <Select value={uriState.format} onValueChange={uriState.setFormat}>
                  <SelectTrigger size='sm'><SelectValue /></SelectTrigger>
                  <SelectContent>{ANNOTATION_URI_FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1 flex-1'>
                <Label className='text-xs'>Schema</Label>
                <Select value={uriState.schema} onValueChange={uriState.setSchema}>
                  <SelectTrigger size='sm'><SelectValue /></SelectTrigger>
                  <SelectContent>{ANNOTATION_URI_SCHEMAS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className='flex gap-3'>
              <div className='flex flex-col gap-1 flex-1'>
                <Label className='text-xs'>Category name <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                <Input className='h-7 text-xs font-mono' placeholder='annotations' value={uriState.categoryName} onChange={(e) => uriState.setCategoryName(e.target.value)} />
              </div>
              <div className='flex flex-col gap-1 flex-1'>
                <Label className='text-xs'>Field name <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                <Input className='h-7 text-xs font-mono' placeholder='label' value={uriState.fieldName} onChange={(e) => uriState.setFieldName(e.target.value)} />
              </div>
            </div>
          </div>
        ),
      }]}
    />
  );
}
