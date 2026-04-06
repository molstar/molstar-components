import { useState } from 'react';
import { Label } from '../../ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx';
import { Button } from '../../ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog.tsx';
import {
  COMPONENT_SELECTORS,
  formatSelectorPreview,
  getActiveValues,
  type ComponentSelectorValue,
} from '@molstar/state-builder';
import { ListIcon } from 'lucide-react';
import { SelectorHelperContent } from '../../helpers/SelectorHelperContent.tsx';

interface ComponentFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

type SelectorMode = 'preset' | 'custom';

function SelectorDialog({
  value,
  onSelect,
}: {
  value: unknown;
  onSelect: (selector: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ComponentSelectorValue | undefined>(undefined);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDraft(value as ComponentSelectorValue | undefined);
    }
    setOpen(isOpen);
  };

  const handleApply = () => {
    if (draft !== undefined) {
      onSelect(draft);
    }
    setOpen(false);
  };

  const preview = formatSelectorPreview(value);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <Button
        variant='outline'
        size='sm'
        className='h-8 justify-start text-left font-normal w-full'
        title='Open selector builder'
        onClick={() => handleOpen(true)}
      >
        <ListIcon className='size-4 mr-2 shrink-0' />
        <span className='truncate'>{preview}</span>
      </Button>

      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Build Component Selector</DialogTitle>
        </DialogHeader>

        <SelectorHelperContent value={draft} onChange={setDraft} />

        <DialogFooter>
          <Button variant='outline' size='sm' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size='sm' onClick={handleApply} disabled={draft === undefined}>
            Apply Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ComponentFields({ params, onChange }: ComponentFieldsProps) {
  const selector = params.selector;
  const activeSelectors = getActiveValues(COMPONENT_SELECTORS);

  // Determine if using a preset or custom selector
  const isPreset = typeof selector === 'string' && activeSelectors.some((s) => s.value === selector);
  const selectorMode: SelectorMode = isPreset ? 'preset' : 'custom';

  const handleModeChange = (mode: SelectorMode) => {
    if (mode === 'preset') {
      onChange({ ...params, selector: 'all' });
    } else {
      onChange({ ...params, selector: undefined });
    }
  };

  const handlePresetChange = (value: string) => {
    onChange({ ...params, selector: value });
  };

  const handleBuilderSelect = (selectorValue: unknown) => {
    onChange({ ...params, selector: selectorValue });
  };

  return (
    <>
      <div className='w-24'>
        <Label className='text-xs'>Mode</Label>
        <Select value={selectorMode} onValueChange={(v) => handleModeChange(v as SelectorMode)}>
          <SelectTrigger size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='preset'>Preset</SelectItem>
            <SelectItem value='custom'>Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectorMode === 'preset' && (
        <div className='w-32'>
          <Label className='text-xs'>Selector</Label>
          <Select value={selector as string} onValueChange={handlePresetChange}>
            <SelectTrigger size='sm'>
              <SelectValue placeholder='Select' />
            </SelectTrigger>
            <SelectContent>
              {activeSelectors.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectorMode === 'custom' && (
        <div className='flex-1'>
          <Label className='text-xs'>Selector</Label>
          <SelectorDialog value={selector} onSelect={handleBuilderSelect} />
        </div>
      )}
    </>
  );
}
