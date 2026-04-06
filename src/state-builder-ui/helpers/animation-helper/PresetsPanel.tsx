import { Button } from '../../base/button.tsx';
import { Label } from '../../base/label.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../base/select.tsx';
import { ANIMATION_PRESETS } from '@molstar/state-builder';
import { useState } from 'react';
import type { PresetsPanelProps } from './types.ts';

export function PresetsPanel({ availableRefs, onApplyPreset }: PresetsPanelProps) {
  const [targetRef, setTargetRef] = useState(availableRefs[0]?.ref || '');

  return (
    <div className='space-y-4'>
      {/* Target ref selector */}
      <div className='space-y-1'>
        <Label className='text-sm'>Apply preset to target ref</Label>
        {availableRefs.length > 0 ? (
          <Select value={targetRef} onValueChange={setTargetRef}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Select ref...' />
            </SelectTrigger>
            <SelectContent>
              {availableRefs.map((r) => (
                <SelectItem key={r.ref} value={r.ref}>
                  {r.ref} ({r.kind})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className='text-xs text-muted-foreground'>
            No refs found in the tree. Add a ref to a node first, or use the &quot;Trackball Spin&quot; preset which doesn&apos;t require a target.
          </p>
        )}
      </div>

      {/* Preset cards */}
      <div className='grid grid-cols-2 gap-3'>
        {ANIMATION_PRESETS.map((preset) => {
          const needsRef = preset.steps.length > 0;
          const canApply = !needsRef || targetRef;

          return (
            <div
              key={preset.id}
              className='border rounded-md p-3 space-y-2'
            >
              <div>
                <h4 className='text-sm font-medium'>{preset.name}</h4>
                <p className='text-xs text-muted-foreground'>{preset.description}</p>
              </div>
              {preset.steps.length > 0 && (
                <div className='text-xs font-mono text-muted-foreground'>
                  {preset.steps.map((s, i) => (
                    <span key={i}>
                      {s.kind}: {s.property} {s.duration_ms}ms
                    </span>
                  ))}
                </div>
              )}
              <Button
                size='sm'
                variant='outline'
                className='w-full'
                disabled={!canApply}
                onClick={() => onApplyPreset(preset, targetRef)}
                title={!canApply ? 'Select a target ref first' : `Apply "${preset.name}" preset`}
              >
                Apply
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
