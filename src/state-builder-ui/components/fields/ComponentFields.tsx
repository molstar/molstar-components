import { Label } from '../../ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx';
import {
  COMPONENT_SELECTORS,
  formatSelectorPreview,
  getActiveValues,
} from '@molstar/state-builder';
import { SelectorHelper } from '../../SelectorHelper.tsx';

interface ComponentFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

type SelectorMode = 'preset' | 'custom';

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
          <SelectorHelper
            onSelect={handleBuilderSelect}
            initialValue={selector}
            preview={formatSelectorPreview(selector)}
          />
        </div>
      )}
    </>
  );
}
