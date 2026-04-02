import { Label } from '../ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.tsx';
import { MOLSTAR_COLOR_THEMES, CARBON_COLOR_OPTIONS } from '@molstar/state-builder';
import type { ThemePanelProps } from './types.ts';

export function ThemePanel({
  themeName,
  carbonColorName,
  carbonColorHex,
  onThemeChange,
  onCarbonColorNameChange,
  onCarbonColorHexChange,
}: ThemePanelProps) {
  return (
    <div className='flex flex-col gap-3 pt-2'>
      <div>
        <Label className='text-xs'>Color Theme</Label>
        <Select value={themeName} onValueChange={onThemeChange}>
          <SelectTrigger size='sm'>
            <SelectValue placeholder='Select theme' />
          </SelectTrigger>
          <SelectContent>
            {MOLSTAR_COLOR_THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {theme.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {themeName === 'element-symbol' && (
        <div>
          <Label className='text-xs'>Carbon Color</Label>
          <div className='flex gap-2 items-end'>
            <div className='flex-1'>
              <Select value={carbonColorName} onValueChange={onCarbonColorNameChange}>
                <SelectTrigger size='sm'>
                  <SelectValue placeholder='Select' />
                </SelectTrigger>
                <SelectContent>
                  {CARBON_COLOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {carbonColorName === 'uniform' && (
              <input
                type='color'
                className='w-9 h-8 rounded border border-gray-300 cursor-pointer p-0 shrink-0'
                value={carbonColorHex}
                onChange={(e) => onCarbonColorHexChange(e.target.value)}
                title='Pick carbon color'
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
