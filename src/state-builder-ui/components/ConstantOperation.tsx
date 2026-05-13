import { Button } from '../base/button.tsx';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select.tsx';
import type { UINode } from '../../state-builder/index.ts';
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import { PlusIcon, XIcon } from 'lucide-react';
import { TreeLines } from './TreeLines.tsx';
import { OperationActions } from './OperationActions.tsx';
import { TypeSelect } from './TypeSelect.tsx';

interface ConstantOperationProps {
  node: UINode;
  depth: number;
  isLast: boolean;
  isFirst: boolean;
  onKindChange: (kind: MVSKind) => void;
  onParamChange: (key: string, value: string) => void;
  onRefChange: (value: string) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCopy?: () => void;
}

/**
 * Special rendering for constant operations with key-value entry editor
 */
export function ConstantOperation({
  node,
  depth,
  isLast,
  isFirst,
  onKindChange,
  onParamChange,
  onRefChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onCopy,
}: ConstantOperationProps) {
  // Parse entries from JSON or create empty array
  let entries: Array<{ key: string; value: string }> = [];
  try {
    if (node.params.entries) {
      entries = JSON.parse(node.params.entries as string);
    }
  } catch {
    entries = [];
  }

  const updateEntries = (newEntries: Array<{ key: string; value: string }>) => {
    onParamChange('entries', JSON.stringify(newEntries));
  };

  const isColorType = node.params.constantType === 'colors';

  return (
    <div className='relative' style={{ marginLeft: depth > 0 ? '20px' : '0' }}>
      <TreeLines depth={depth} isLast={isLast} />

      <div className='border rounded-md p-2 bg-card space-y-2'>
        {/* First row: Type selector, Const Type, Name, Ref, Actions */}
        <div className='flex gap-2 items-end'>
          <TypeSelect value={node.kind} onChange={onKindChange} />

          <div className='w-32'>
            <Label className='text-xs'>Const Type</Label>
            <Select
              value={(node.params.constantType as string) || 'generic'}
              onValueChange={(value) => onParamChange('constantType', value)}
            >
              <SelectTrigger size='sm'>
                <SelectValue placeholder='Select' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='colors'>Colors</SelectItem>
                <SelectItem value='domains'>Domains</SelectItem>
                <SelectItem value='generic'>Generic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex-1'>
            <Label className='text-xs'>Name</Label>
            <Input
              className='h-8 text-sm'
              placeholder='e.g., Colors'
              value={(node.params.name as string) || ''}
              onChange={(e) => onParamChange('name', e.target.value)}
            />
          </div>

          <div className='w-24'>
            <Label className='text-xs'>Ref</Label>
            <Input
              className='h-8 text-sm'
              placeholder='name'
              value={node.ref || ''}
              onChange={(e) => onRefChange(e.target.value)}
              title='Reference name to use this operation later'
            />
          </div>

          <OperationActions
            isFirst={isFirst}
            isLast={isLast}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onCopy={onCopy}
            onRemove={onRemove}
          />
        </div>

        {/* Second row: Key-Value entries */}
        <div className='border-t pt-2'>
          <Label className='text-xs mb-2 block'>Entries</Label>
          <div className='space-y-1'>
            {entries.map((entry, idx) => (
              <div key={idx} className='flex gap-2 items-center'>
                <Input
                  className='h-8 text-sm w-32'
                  placeholder='Key'
                  value={entry.key}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[idx].key = e.target.value;
                    updateEntries(updated);
                  }}
                />
                <Input
                  className='h-8 text-sm flex-1'
                  placeholder={isColorType ? '#4577B2' : 'Value'}
                  value={entry.value}
                  onChange={(e) => {
                    const updated = [...entries];
                    updated[idx].value = e.target.value;
                    updateEntries(updated);
                  }}
                />
                {isColorType && (
                  <div
                    className='w-8 h-8 rounded border border-gray-300'
                    style={{ backgroundColor: entry.value }}
                    title={entry.value}
                  />
                )}
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    const updated = entries.filter((_, i) => i !== idx);
                    updateEntries(updated);
                  }}
                  className='h-8 w-8 p-0'
                >
                  <XIcon className='size-4' />
                </Button>
              </div>
            ))}
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                updateEntries([...entries, { key: '', value: isColorType ? '#000000' : '' }]);
              }}
              className='h-8'
            >
              <PlusIcon className='size-4 mr-1' />
              Add Entry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
