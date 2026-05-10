'use client';

import { useState, useEffect } from 'react';
import { DatabaseIcon, ChevronRightIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../base/dialog.tsx';
import { Button } from '../base/button.tsx';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select.tsx';
import { NumericInput } from '../components/NumericInput.tsx';
import { cn } from '../lib/utils.ts';

const SCHEMA_OPTIONS = [
  'whole_structure', 'entity', 'chain', 'auth_chain',
  'residue', 'auth_residue', 'residue_range', 'auth_residue_range',
  'atom', 'auth_atom', 'all_atomic',
] as const;

const FORMAT_OPTIONS = ['cif', 'bcif', 'json'] as const;

function filename(uri: string): string {
  try {
    return uri.split('/').pop() || uri;
  } catch {
    return uri;
  }
}

interface AnnotationHelperProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
  hasUri: boolean;
  hasPalette?: boolean;
  hasFieldValues?: boolean;
}

export function AnnotationHelper({ params, onChange, hasUri, hasPalette, hasFieldValues }: AnnotationHelperProps) {
  const [open, setOpen] = useState(false);

  // CIF controls collapsible
  const [cifOpen, setCifOpen] = useState(false);
  // Field remapping collapsible
  const [remapOpen, setRemapOpen] = useState(false);
  // Palette collapsible
  const [paletteOpen, setPaletteOpen] = useState(false);

  // JSON textarea local state
  const [remapInput, setRemapInput] = useState(() =>
    params.field_remapping != null ? JSON.stringify(params.field_remapping, null, 2) : ''
  );
  const [remapError, setRemapError] = useState('');

  const [paletteInput, setPaletteInput] = useState(() =>
    params.palette != null ? JSON.stringify(params.palette, null, 2) : ''
  );
  const [paletteError, setPaletteError] = useState('');

  // Sync from external params changes (e.g. import)
  useEffect(() => {
    setRemapInput(params.field_remapping != null ? JSON.stringify(params.field_remapping, null, 2) : '');
    setRemapError('');
  }, [params.field_remapping]);

  useEffect(() => {
    setPaletteInput(params.palette != null ? JSON.stringify(params.palette, null, 2) : '');
    setPaletteError('');
  }, [params.palette]);

  const set = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === '') {
      const next = { ...params };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...params, [key]: value });
    }
  };

  const handleRemapChange = (v: string) => {
    setRemapInput(v);
    if (!v.trim()) {
      setRemapError('');
      const next = { ...params };
      delete next['field_remapping'];
      onChange(next);
      return;
    }
    try {
      const parsed = JSON.parse(v);
      setRemapError('');
      onChange({ ...params, field_remapping: parsed });
    } catch {
      setRemapError('Invalid JSON');
    }
  };

  const handlePaletteChange = (v: string) => {
    setPaletteInput(v);
    if (!v.trim()) {
      setPaletteError('');
      const next = { ...params };
      delete next['palette'];
      onChange(next);
      return;
    }
    try {
      const parsed = JSON.parse(v);
      setPaletteError('');
      onChange({ ...params, palette: parsed });
    } catch {
      setPaletteError('Invalid JSON');
    }
  };

  const handleFieldValuesChange = (v: string) => {
    const values = v.split('\n').filter((s) => s.trim() !== '');
    if (values.length > 0) {
      onChange({ ...params, field_values: values });
    } else {
      const next = { ...params };
      delete next['field_values'];
      onChange(next);
    }
  };

  // Preview text for the trigger button
  const previewText = (() => {
    if (hasUri && params.uri) {
      return `${params.schema || '—'} · ${filename(params.uri as string)}`;
    }
    if (params.schema) return params.schema as string;
    return 'Click to configure...';
  })();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 w-full justify-start font-normal' title='Configure annotation'>
          <DatabaseIcon className='size-4 mr-2 shrink-0' />
          <span className='truncate text-xs'>{previewText}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Configure Annotation</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Source section */}
          <div className='space-y-2'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Source</p>

            {hasUri && (
              <div>
                <Label className='text-xs'>URI</Label>
                <Input
                  className='h-8 text-sm font-mono'
                  placeholder='https://...'
                  value={(params.uri as string) ?? ''}
                  onChange={(e) => set('uri', e.target.value)}
                />
              </div>
            )}

            <div className='flex gap-2'>
              <div className='flex-1'>
                <Label className='text-xs'>Format</Label>
                <Select value={(params.format as string) ?? ''} onValueChange={(v) => set('format', v)}>
                  <SelectTrigger className='h-8 text-xs'>
                    <SelectValue placeholder='Select format' />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((f) => (
                      <SelectItem key={f} value={f} className='text-xs'>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex-1'>
                <Label className='text-xs'>Schema</Label>
                <Select value={(params.schema as string) ?? ''} onValueChange={(v) => set('schema', v)}>
                  <SelectTrigger className='h-8 text-xs'>
                    <SelectValue placeholder='Select schema' />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEMA_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className='text-xs'>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Field section */}
          <div className='space-y-2'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Field</p>
            <div className='flex gap-2'>
              <div className='flex-1'>
                <Label className='text-xs'>Field name</Label>
                <Input
                  className='h-8 text-sm'
                  placeholder='color'
                  value={(params.field_name as string) ?? ''}
                  onChange={(e) => set('field_name', e.target.value)}
                />
              </div>

              {hasFieldValues && (
                <div className='flex-1'>
                  <Label className='text-xs'>Field values (one per line)</Label>
                  <textarea
                    className='w-full text-xs font-mono border rounded-md p-2 min-h-[60px] resize-y bg-background'
                    placeholder={'value1\nvalue2'}
                    value={((params.field_values as string[]) ?? []).join('\n')}
                    onChange={(e) => handleFieldValuesChange(e.target.value)}
                    spellCheck={false}
                  />
                </div>
              )}
            </div>
          </div>

          {/* CIF Controls collapsible */}
          <div>
            <button
              type='button'
              className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
              onClick={() => setCifOpen((o) => !o)}
            >
              <ChevronRightIcon className={cn('size-3 transition-transform', cifOpen && 'rotate-90')} />
              CIF Controls
            </button>
            {cifOpen && (
              <div className='mt-2 flex gap-2'>
                <div className='flex-1'>
                  <Label className='text-xs'>Category name</Label>
                  <Input
                    className='h-8 text-sm font-mono'
                    placeholder='_struct'
                    value={(params.category_name as string) ?? ''}
                    onChange={(e) => set('category_name', e.target.value)}
                  />
                </div>
                <div className='flex-1'>
                  <Label className='text-xs'>Block header</Label>
                  <Input
                    className='h-8 text-sm font-mono'
                    placeholder='data_'
                    value={(params.block_header as string) ?? ''}
                    onChange={(e) => set('block_header', e.target.value)}
                  />
                </div>
                <div className='w-24'>
                  <Label className='text-xs'>Block index</Label>
                  <NumericInput
                    className='h-8 text-sm'
                    placeholder='0'
                    value={(params.block_index as number) ?? 0}
                    onChange={(v) => set('block_index', v)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Field Remapping collapsible */}
          <div>
            <button
              type='button'
              className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
              onClick={() => setRemapOpen((o) => !o)}
            >
              <ChevronRightIcon className={cn('size-3 transition-transform', remapOpen && 'rotate-90')} />
              Field Remapping
              {params.field_remapping != null && (
                <span className='ml-1 size-1.5 rounded-full bg-primary inline-block' />
              )}
            </button>
            {remapOpen && (
              <div className='mt-2'>
                <p className='text-xs text-muted-foreground mb-1'>Map standard field names to actual column names.</p>
                <textarea
                  className='w-full text-xs font-mono border rounded-md p-2 min-h-[80px] resize-y bg-background'
                  placeholder='{ "label_asym_id": "X" }'
                  value={remapInput}
                  onChange={(e) => handleRemapChange(e.target.value)}
                  spellCheck={false}
                />
                {remapError && <p className='text-xs text-destructive mt-1'>{remapError}</p>}
              </div>
            )}
          </div>

          {/* Palette collapsible (only for color nodes) */}
          {hasPalette && (
            <div>
              <button
                type='button'
                className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
                onClick={() => setPaletteOpen((o) => !o)}
              >
                <ChevronRightIcon className={cn('size-3 transition-transform', paletteOpen && 'rotate-90')} />
                Palette
                {params.palette != null && (
                  <span className='ml-1 size-1.5 rounded-full bg-primary inline-block' />
                )}
              </button>
              {paletteOpen && (
                <div className='mt-2'>
                  <p className='text-xs text-muted-foreground mb-1'>
                    Optional: paste palette JSON. Leave empty for default coloring.
                  </p>
                  <textarea
                    className='w-full text-xs font-mono border rounded-md p-2 min-h-[80px] resize-y bg-background'
                    placeholder='{ "kind": "categorical", ... }'
                    value={paletteInput}
                    onChange={(e) => handlePaletteChange(e.target.value)}
                    spellCheck={false}
                  />
                  {paletteError && <p className='text-xs text-destructive mt-1'>{paletteError}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
