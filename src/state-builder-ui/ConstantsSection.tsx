'use client';

import { Button } from './base/button.tsx';
import { Input } from './base/input.tsx';
import { Label } from './base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './base/select.tsx';
import {
  ConstantDefinition,
  ConstantEntry,
  ConstantType,
} from '../state-builder/index.ts';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, XIcon } from 'lucide-react';

interface ConstantsSectionProps {
  constants: ConstantDefinition[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onConstantsChange: (constants: ConstantDefinition[]) => void;
  label?: string;
  readOnly?: boolean;
}

export function ConstantsSection({
  constants,
  expanded,
  onToggleExpanded,
  onConstantsChange,
  label = 'Constants',
  readOnly = false,
}: ConstantsSectionProps) {
  const updateConstant = (id: string, updates: Partial<ConstantDefinition>) => {
    onConstantsChange(
      constants.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const removeConstant = (id: string) => {
    onConstantsChange(constants.filter((c) => c.id !== id));
  };

  const updateEntry = (constantId: string, entryIndex: number, updates: Partial<ConstantEntry>) => {
    onConstantsChange(
      constants.map((c) => {
        if (c.id !== constantId) return c;
        const newEntries = [...c.entries];
        newEntries[entryIndex] = { ...newEntries[entryIndex], ...updates };
        return { ...c, entries: newEntries };
      })
    );
  };

  const addEntry = (constantId: string) => {
    onConstantsChange(
      constants.map((c) => {
        if (c.id !== constantId) return c;
        const defaultValue = c.type === 'colors' ? '#000000' : '';
        return { ...c, entries: [...c.entries, { key: '', value: defaultValue }] };
      })
    );
  };

  const removeEntry = (constantId: string, entryIndex: number) => {
    onConstantsChange(
      constants.map((c) => {
        if (c.id !== constantId) return c;
        return { ...c, entries: c.entries.filter((_, i) => i !== entryIndex) };
      })
    );
  };

  return (
    <div className='border rounded-lg bg-card shadow-sm'>
      {/* Header */}
      <div
        className='flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50'
        onClick={onToggleExpanded}
      >
        {expanded ? (
          <ChevronDownIcon className='size-4' />
        ) : (
          <ChevronRightIcon className='size-4' />
        )}
        <span className='inline-block rounded-full shrink-0' style={{ width: 7, height: 7, background: '#94a3b8' }} />
        <span className='text-sm font-medium'>{label}</span>
        <span className='text-xs text-muted-foreground'>({constants.length})</span>
      </div>

      {/* Content */}
      {expanded && (
        <div className='p-2 pt-0 space-y-3'>
          {constants.length === 0 ? (
            <div className='text-sm text-muted-foreground text-center py-2'>
              No constants defined. Click &quot;Add&quot; to create reusable values.
            </div>
          ) : (
            constants.map((constant) => (
              <ConstantEditor
                key={constant.id}
                constant={constant}
                readOnly={readOnly}
                onUpdate={(updates) => updateConstant(constant.id, updates)}
                onRemove={() => removeConstant(constant.id)}
                onUpdateEntry={(idx, updates) => updateEntry(constant.id, idx, updates)}
                onAddEntry={() => addEntry(constant.id)}
                onRemoveEntry={(idx) => removeEntry(constant.id, idx)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface ConstantEditorProps {
  constant: ConstantDefinition;
  readOnly?: boolean;
  onUpdate: (updates: Partial<ConstantDefinition>) => void;
  onRemove: () => void;
  onUpdateEntry: (index: number, updates: Partial<ConstantEntry>) => void;
  onAddEntry: () => void;
  onRemoveEntry: (index: number) => void;
}

function ConstantEditor({
  constant,
  readOnly = false,
  onUpdate,
  onRemove,
  onUpdateEntry,
  onAddEntry,
  onRemoveEntry,
}: ConstantEditorProps) {
  const isColorType = constant.type === 'colors';

  return (
    <div className='border rounded-md p-2 bg-card space-y-2'>
      {/* First row: Type, Name, Remove */}
      <div className='flex gap-2 items-end'>
        {readOnly ? (
          <div className='flex-1'>
            <span className='text-sm font-medium'>{constant.name}</span>
            <span className='text-xs text-muted-foreground ml-2'>({constant.type})</span>
          </div>
        ) : (
          <>
            <div className='w-28'>
              <Label className='text-xs'>Type</Label>
              <Select
                value={constant.type}
                onValueChange={(value) => onUpdate({ type: value as ConstantType })}
              >
                <SelectTrigger size='sm'>
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='colors'>Colors</SelectItem>
                  <SelectItem value='urls'>URLs</SelectItem>
                  <SelectItem value='generic'>Generic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex-1'>
              <Label className='text-xs'>Name</Label>
              <Input
                className='h-8 text-sm'
                placeholder='e.g., Colors'
                value={constant.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
              />
            </div>

            <Button
              variant='ghost'
              size='sm'
              onClick={onRemove}
              className='h-8 w-8 p-0'
              title='Remove constant'
            >
              <XIcon className='size-4' />
            </Button>
          </>
        )}
      </div>

      {/* Second row: Entries */}
      <div className='border-t pt-2'>
        <Label className='text-xs mb-2 block'>Entries</Label>
        <div className='space-y-1'>
          {constant.entries.map((entry, idx) => (
            <div key={idx} className='flex gap-2 items-center'>
              <Input
                className='h-8 text-sm w-32'
                placeholder='Key'
                value={entry.key}
                readOnly={readOnly}
                onChange={readOnly ? undefined : (e) => onUpdateEntry(idx, { key: e.target.value })}
              />
              <Input
                className='h-8 text-sm flex-1'
                placeholder={isColorType ? '#4577B2' : 'Value'}
                value={entry.value}
                readOnly={readOnly}
                onChange={readOnly ? undefined : (e) => onUpdateEntry(idx, { value: e.target.value })}
              />
              {isColorType && (
                <input
                  type='color'
                  className='w-8 h-8 rounded border border-gray-300'
                  style={{ cursor: readOnly ? 'default' : 'pointer' }}
                  value={entry.value || '#000000'}
                  disabled={readOnly}
                  onChange={readOnly ? undefined : (e) => onUpdateEntry(idx, { value: e.target.value })}
                  title={entry.value}
                />
              )}
              {!readOnly && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => onRemoveEntry(idx)}
                  className='h-8 w-8 p-0'
                >
                  <XIcon className='size-4' />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button
              variant='outline'
              size='sm'
              onClick={onAddEntry}
              className='h-8'
            >
              <PlusIcon className='size-4 mr-1' />
              Add Entry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
