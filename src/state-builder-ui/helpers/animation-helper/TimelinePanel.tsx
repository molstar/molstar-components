'use client';

import { Label } from '../../base/label.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../base/select.tsx';
import { PlusIcon } from 'lucide-react';
import {
  INTERPOLATION_KINDS,
  createEmptyInterpolationStep,
  computeAnimationDuration,
} from '../../../state-builder/index.ts';
import type {
  InterpolationStep,
  InterpolationKind,
} from '../../../state-builder/index.ts';
import type { TimelinePanelProps } from './types.ts';
import { StepCard } from './timeline/StepCard.tsx';

export function TimelinePanel({
  frameTimeMs,
  durationMs,
  autoplay,
  loop,
  includeCamera,
  includeCanvas,
  trackball,
  steps,
  availableRefs,
  onFrameTimeMsChange,
  onDurationMsChange,
  onAutoplayChange,
  onLoopChange,
  onIncludeCameraChange,
  onIncludeCanvasChange,
  onTrackballChange,
  onStepsChange,
}: TimelinePanelProps) {
  const totalDuration = durationMs ?? computeAnimationDuration(steps);

  const updateStep = (id: string, updates: Partial<InterpolationStep>) => {
    onStepsChange(
      steps.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const removeStep = (id: string) => {
    onStepsChange(steps.filter((s) => s.id !== id));
  };

  const moveStep = (id: string, direction: -1 | 1) => {
    const idx = steps.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[idx], newSteps[newIdx]] = [newSteps[newIdx], newSteps[idx]];
    onStepsChange(newSteps);
  };

  const addStep = (kind: InterpolationKind = 'scalar') => {
    onStepsChange([...steps, createEmptyInterpolationStep(kind)]);
  };

  return (
    <div className='space-y-4'>
      {/* Animation Settings */}
      <div className='border rounded-md p-3 space-y-3'>
        <h4 className='text-sm font-medium'>Animation Settings</h4>
        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1'>
            <Label className='text-xs'>Frame Time (ms)</Label>
            <NumericInput
              className='h-8 no-spinners'
              placeholder='33'
              value={frameTimeMs ?? undefined}
              onChange={onFrameTimeMsChange}
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-xs'>Duration (ms)</Label>
            <NumericInput
              className='h-8 no-spinners'
              placeholder={totalDuration > 0 ? `${totalDuration} (auto)` : 'auto'}
              value={durationMs ?? undefined}
              onChange={(v) => onDurationMsChange(v ?? null)}
            />
          </div>
        </div>
        <div className='flex flex-wrap gap-4'>
          <label className='flex items-center gap-1.5 text-xs'>
            <input type='checkbox' checked={autoplay} onChange={(e) => onAutoplayChange(e.target.checked)} className='accent-primary' />
            Autoplay
          </label>
          <label className='flex items-center gap-1.5 text-xs'>
            <input type='checkbox' checked={loop} onChange={(e) => onLoopChange(e.target.checked)} className='accent-primary' />
            Loop
          </label>
          <label className='flex items-center gap-1.5 text-xs'>
            <input type='checkbox' checked={includeCamera} onChange={(e) => onIncludeCameraChange(e.target.checked)} className='accent-primary' />
            Include Camera
          </label>
          <label className='flex items-center gap-1.5 text-xs'>
            <input type='checkbox' checked={includeCanvas} onChange={(e) => onIncludeCanvasChange(e.target.checked)} className='accent-primary' />
            Include Canvas
          </label>
        </div>

        {/* Trackball spin */}
        <div className='flex items-center gap-3'>
          <label className='flex items-center gap-1.5 text-xs'>
            <input type='checkbox' checked={trackball.enabled} onChange={(e) => onTrackballChange({ ...trackball, enabled: e.target.checked })} className='accent-primary' />
            Trackball Spin
          </label>
          {trackball.enabled && (
            <div className='flex items-center gap-2 flex-1'>
              <Label className='text-xs text-muted-foreground whitespace-nowrap'>Speed:</Label>
              <input
                type='range'
                min={-0.2}
                max={0.2}
                step={0.005}
                value={trackball.speed}
                onChange={(e) => onTrackballChange({ ...trackball, speed: Number(e.target.value) })}
                className='flex-1'
              />
              <span className='text-xs font-mono w-12 text-right'>{trackball.speed.toFixed(3)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h4 className='text-sm font-medium'>Interpolation Steps</h4>
          <Select onValueChange={(v) => addStep(v as InterpolationKind)}>
            <SelectTrigger className='h-8 w-auto gap-1'>
              <PlusIcon className='size-3.5' />
              <SelectValue placeholder='Add Step' />
            </SelectTrigger>
            <SelectContent>
              {INTERPOLATION_KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {steps.length === 0 ? (
          <div className='border rounded-md p-4 text-center text-sm text-muted-foreground'>
            No steps yet. Add a step or use a preset.
          </div>
        ) : (
          <div className='space-y-2'>
            {steps.map((step, idx) => (
              <StepCard
                key={step.id}
                step={step}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === steps.length - 1}
                totalDuration={totalDuration}
                availableRefs={availableRefs}
                onUpdate={(updates) => updateStep(step.id, updates)}
                onRemove={() => removeStep(step.id)}
                onMoveUp={() => moveStep(step.id, -1)}
                onMoveDown={() => moveStep(step.id, 1)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
