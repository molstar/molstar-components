'use client';

import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { Label } from '../ui/label.tsx';
import { NumericInput } from '../components/NumericInput.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.tsx';
import { Switch } from '../ui/switch.tsx';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  EASING_OPTIONS,
  INTERPOLATION_KINDS,
  KIND_COLORS,
  PROPERTY_KIND_MAP,
  createEmptyInterpolationStep,
  computeAnimationDuration,
  getAnimatableProperties,
  filterRefsForKind,
  IDENTITY_3x3,
} from '@molstar/state-builder';
import type {
  InterpolationStep,
  InterpolationKind,
  EasingType,
  SimpleInterpolationStep,
  TransformMatrixInterpolationStep,
  RefInfo,
} from '@molstar/state-builder';
import type { TimelinePanelProps } from './types.ts';
import { RotationMatrixPanel } from '../transform-helper/index.ts';

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
            <Switch checked={autoplay} onCheckedChange={onAutoplayChange} />
            Autoplay
          </label>
          <label className='flex items-center gap-1.5 text-xs'>
            <Switch checked={loop} onCheckedChange={onLoopChange} />
            Loop
          </label>
          <label className='flex items-center gap-1.5 text-xs'>
            <Switch checked={includeCamera} onCheckedChange={onIncludeCameraChange} />
            Include Camera
          </label>
          <label className='flex items-center gap-1.5 text-xs'>
            <Switch checked={includeCanvas} onCheckedChange={onIncludeCanvasChange} />
            Include Canvas
          </label>
        </div>

        {/* Trackball spin */}
        <div className='flex items-center gap-3'>
          <label className='flex items-center gap-1.5 text-xs'>
            <Switch
              checked={trackball.enabled}
              onCheckedChange={(v: boolean) => onTrackballChange({ ...trackball, enabled: v })}
            />
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

// ============================================================
// Step Card
// ============================================================

interface StepCardProps {
  step: InterpolationStep;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  totalDuration: number;
  availableRefs: RefInfo[];
  onUpdate: (updates: Partial<InterpolationStep>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function StepCard({
  step,
  index,
  isFirst,
  isLast,
  totalDuration,
  availableRefs,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: StepCardProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const kindColor = KIND_COLORS[step.kind];
  const filteredRefs = filterRefsForKind(availableRefs, step.kind);
  const selectedRefInfo = availableRefs.find((r) => r.ref === step.target_ref);
  const propertySuggestions = getAnimatableProperties(selectedRefInfo?.kind, step.kind);
  const singleProperty = propertySuggestions.length === 1;

  // Auto-select property when there's only one option
  useEffect(() => {
    if (singleProperty && step.property !== propertySuggestions[0].value) {
      onUpdate({ property: propertySuggestions[0].value });
    }
  }, [singleProperty, propertySuggestions, step.property, onUpdate]);

  // Timeline bar calculations
  const startMs = step.start_ms || 0;
  const endMs = startMs + step.duration_ms;
  const barLeft = totalDuration > 0 ? (startMs / totalDuration) * 100 : 0;
  const barWidth = totalDuration > 0 ? (step.duration_ms / totalDuration) * 100 : 100;

  return (
    <div className='border rounded-md p-3 space-y-2' style={{ borderLeftColor: kindColor, borderLeftWidth: 3 }}>
      {/* Row 1: Kind, Target Ref, Property */}
      <div className='flex gap-2'>
        <div className='w-36'>
          <Select
            value={step.kind}
            onValueChange={(v) => {
              const kind = v as InterpolationKind;
              if (kind === 'transform_matrix') {
                onUpdate({ kind, property: 'matrix' } as Partial<TransformMatrixInterpolationStep>);
              } else {
                // Clear property if it's incompatible with the new kind
                const currentProp = step.property;
                const propKind = currentProp ? PROPERTY_KIND_MAP[currentProp] : undefined;
                const clearProperty = propKind && propKind !== kind;
                onUpdate({ kind, ...(clearProperty && { property: '' }) } as Partial<SimpleInterpolationStep>);
              }
            }}
          >
            <SelectTrigger className='h-8 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERPOLATION_KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex-1'>
          {filteredRefs.length > 0 ? (
            <Select
              value={step.target_ref || undefined}
              onValueChange={(v) => onUpdate({ target_ref: v })}
            >
              <SelectTrigger className='h-8 text-xs'>
                <SelectValue placeholder='Target ref...' />
              </SelectTrigger>
              <SelectContent>
                {filteredRefs.map((r) => (
                  <SelectItem key={r.ref} value={r.ref}>{r.ref} ({r.kind})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              className='h-8 text-xs'
              placeholder='target_ref'
              value={step.target_ref}
              onChange={(e) => onUpdate({ target_ref: e.target.value })}
            />
          )}
        </div>

        {!singleProperty && (
          <div className='w-36'>
            <Select
              value={step.property || undefined}
              onValueChange={(v) => onUpdate({ property: v })}
            >
              <SelectTrigger className='h-8 text-xs'>
                <SelectValue placeholder='Property...' />
              </SelectTrigger>
              <SelectContent>
                {propertySuggestions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Row 2: Values & Timing — different for transform_matrix */}
      {step.kind === 'transform_matrix' ? (
        <TransformMatrixFields
          step={step as TransformMatrixInterpolationStep}
          onUpdate={onUpdate}
        />
      ) : (
        <SimpleValueFields
          step={step as SimpleInterpolationStep}
          onUpdate={onUpdate}
        />
      )}

      {/* Row 3: Timing (always shown) */}
      <div className='flex gap-2'>
        <div className='flex-1'>
          <Label className='text-[10px] text-muted-foreground'>Duration (ms)</Label>
          <NumericInput
            className='h-7 text-xs no-spinners'
            value={step.duration_ms}
            onChange={(v) => onUpdate({ duration_ms: v ?? 0 })}
          />
        </div>
        <div className='flex-1'>
          <Label className='text-[10px] text-muted-foreground'>Start at (ms)</Label>
          <NumericInput
            className='h-7 text-xs no-spinners'
            placeholder='0'
            value={step.start_ms ?? undefined}
            onChange={(v) => onUpdate({ start_ms: v })}
          />
        </div>
        {step.kind !== 'transform_matrix' && (
          <div className='w-36'>
            <Label className='text-[10px] text-muted-foreground'>Easing</Label>
            <Select
              value={(step as SimpleInterpolationStep).easing || 'linear'}
              onValueChange={(v) => onUpdate({ easing: v as EasingType } as Partial<SimpleInterpolationStep>)}
            >
              <SelectTrigger className='h-7 text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EASING_OPTIONS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Timeline bar */}
      {totalDuration > 0 && (
        <div className='relative h-2 bg-muted rounded-full overflow-hidden'>
          <div
            className='absolute h-full rounded-full'
            style={{
              left: `${barLeft}%`,
              width: `${Math.max(barWidth, 2)}%`,
              backgroundColor: kindColor,
              opacity: 0.7,
            }}
          />
        </div>
      )}

      {/* Advanced toggle + Actions */}
      <div className='flex items-center justify-between'>
        <button
          className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          {advancedOpen ? <ChevronDownIcon className='size-3' /> : <ChevronRightIcon className='size-3' />}
          Advanced
        </button>
        <div className='flex gap-1'>
          <Button size='icon' variant='ghost' className='h-6 w-6' onClick={onMoveUp} disabled={isFirst} title='Move up'>
            <ArrowUpIcon className='size-3' />
          </Button>
          <Button size='icon' variant='ghost' className='h-6 w-6' onClick={onMoveDown} disabled={isLast} title='Move down'>
            <ArrowDownIcon className='size-3' />
          </Button>
          <Button size='icon' variant='ghost' className='h-6 w-6 text-destructive' onClick={onRemove} title='Delete step'>
            <Trash2Icon className='size-3' />
          </Button>
        </div>
      </div>

      {/* Advanced options */}
      {advancedOpen && (
        <AdvancedOptions step={step} onUpdate={onUpdate} />
      )}
    </div>
  );
}

// ============================================================
// Value Fields for simple kinds (scalar, vec3, rotation_matrix, color)
// ============================================================

function SimpleValueFields({
  step,
  onUpdate,
}: {
  step: SimpleInterpolationStep;
  onUpdate: (updates: Partial<SimpleInterpolationStep>) => void;
}) {
  if (step.kind === 'scalar') {
    const startVal = typeof step.start === 'number' ? step.start : '';
    const endVal = typeof step.end === 'number' ? step.end : '';
    return (
      <div className='flex gap-2'>
        <div className='flex-1'>
          <Label className='text-[10px] text-muted-foreground'>Start</Label>
          <NumericInput
            className='h-7 text-xs no-spinners'
            placeholder='0'
            value={typeof startVal === 'number' ? startVal : undefined}
            onChange={(v) => onUpdate({ start: v as unknown as number })}
          />
        </div>
        <div className='flex-1'>
          <Label className='text-[10px] text-muted-foreground'>End</Label>
          <NumericInput
            className='h-7 text-xs no-spinners'
            placeholder='1'
            value={typeof endVal === 'number' ? endVal : undefined}
            onChange={(v) => onUpdate({ end: v as unknown as number })}
          />
        </div>
      </div>
    );
  }

  if (step.kind === 'vec3') {
    const startArr = (Array.isArray(step.start) ? step.start : [0, 0, 0]) as number[];
    const endArr = (Array.isArray(step.end) ? step.end : [0, 0, 0]) as number[];
    return (
      <div className='space-y-1'>
        <Vec3Input label='Start' value={startArr} onChange={(v) => onUpdate({ start: v })} />
        <Vec3Input label='End' value={endArr} onChange={(v) => onUpdate({ end: v })} />
      </div>
    );
  }

  if (step.kind === 'color') {
    const startColor = typeof step.start === 'string' ? step.start : String(step.start ?? '');
    const endColor = typeof step.end === 'string' ? step.end : String(step.end ?? '');
    return (
      <div className='flex gap-2'>
        <div className='flex-1 space-y-0.5'>
          <Label className='text-[10px] text-muted-foreground'>Start Color</Label>
          <div className='flex gap-1'>
            <Input
              className='h-7 text-xs flex-1'
              placeholder='#FF0000'
              value={startColor}
              onChange={(e) => onUpdate({ start: e.target.value as unknown as number })}
            />
            <input
              type='color'
              className='w-7 h-7 rounded border cursor-pointer p-0'
              value={startColor.startsWith('#') ? startColor : '#808080'}
              onChange={(e) => onUpdate({ start: e.target.value as unknown as number })}
            />
          </div>
        </div>
        <div className='flex-1 space-y-0.5'>
          <Label className='text-[10px] text-muted-foreground'>End Color</Label>
          <div className='flex gap-1'>
            <Input
              className='h-7 text-xs flex-1'
              placeholder='#0000FF'
              value={endColor}
              onChange={(e) => onUpdate({ end: e.target.value as unknown as number })}
            />
            <input
              type='color'
              className='w-7 h-7 rounded border cursor-pointer p-0'
              value={endColor.startsWith('#') ? endColor : '#808080'}
              onChange={(e) => onUpdate({ end: e.target.value as unknown as number })}
            />
          </div>
        </div>
      </div>
    );
  }

  if (step.kind === 'rotation_matrix') {
    return (
      <RotationMatrixFields step={step} onUpdate={onUpdate} />
    );
  }

  return null;
}

// ============================================================
// Rotation Matrix fields (euler angles)
// ============================================================

function RotationMatrixFields({
  step,
  onUpdate,
}: {
  step: SimpleInterpolationStep;
  onUpdate: (updates: Partial<SimpleInterpolationStep>) => void;
}) {
  const startMatrix = (Array.isArray(step.start) && step.start.length === 9
    ? step.start
    : IDENTITY_3x3) as number[];
  const endMatrix = (Array.isArray(step.end) && step.end.length === 9
    ? step.end
    : IDENTITY_3x3) as number[];

  return (
    <div className='space-y-3'>
      <div>
        <Label className='text-[10px] text-muted-foreground mb-1'>Start</Label>
        <RotationMatrixPanel
          matrix={startMatrix}
          onChange={(m) => onUpdate({ start: m as unknown as number })}
        />
      </div>
      <div>
        <Label className='text-[10px] text-muted-foreground mb-1'>End</Label>
        <RotationMatrixPanel
          matrix={endMatrix}
          onChange={(m) => onUpdate({ end: m as unknown as number })}
        />
      </div>
    </div>
  );
}

// ============================================================
// Transform Matrix fields (3 channels)
// ============================================================

function TransformMatrixFields({
  step,
  onUpdate,
}: {
  step: TransformMatrixInterpolationStep;
  onUpdate: (updates: Partial<TransformMatrixInterpolationStep>) => void;
}) {
  const [rotOpen, setRotOpen] = useState(false);
  const [transOpen, setTransOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);

  return (
    <div className='space-y-1'>
      {/* Pivot */}
      <Vec3Input
        label='Pivot'
        value={step.pivot || [0, 0, 0]}
        onChange={(v) => onUpdate({ pivot: v as [number, number, number] })}
      />

      {/* Rotation channel */}
      <ChannelSection
        label='Rotation'
        open={rotOpen}
        onToggle={() => setRotOpen(!rotOpen)}
        easing={step.rotation_easing}
        frequency={step.rotation_frequency}
        alternateDirection={step.rotation_alternate_direction}
        onEasingChange={(v) => onUpdate({ rotation_easing: v })}
        onFrequencyChange={(v) => onUpdate({ rotation_frequency: v })}
        onAlternateDirectionChange={(v) => onUpdate({ rotation_alternate_direction: v })}
      >
        <div>
          <Label className='text-[10px] text-muted-foreground mb-1'>Start</Label>
          <RotationMatrixPanel
            matrix={step.rotation_start?.length === 9 ? step.rotation_start : IDENTITY_3x3}
            onChange={(m) => onUpdate({ rotation_start: m })}
          />
        </div>
        <div>
          <Label className='text-[10px] text-muted-foreground mb-1'>End</Label>
          <RotationMatrixPanel
            matrix={step.rotation_end?.length === 9 ? step.rotation_end : IDENTITY_3x3}
            onChange={(m) => onUpdate({ rotation_end: m })}
          />
        </div>
      </ChannelSection>

      {/* Translation channel */}
      <ChannelSection
        label='Translation'
        open={transOpen}
        onToggle={() => setTransOpen(!transOpen)}
        easing={step.translation_easing}
        frequency={step.translation_frequency}
        alternateDirection={step.translation_alternate_direction}
        onEasingChange={(v) => onUpdate({ translation_easing: v })}
        onFrequencyChange={(v) => onUpdate({ translation_frequency: v })}
        onAlternateDirectionChange={(v) => onUpdate({ translation_alternate_direction: v })}
      >
        <Vec3Input
          label='Start'
          value={step.translation_start || [0, 0, 0]}
          onChange={(v) => onUpdate({ translation_start: v as [number, number, number] })}
        />
        <Vec3Input
          label='End'
          value={step.translation_end || [0, 0, 0]}
          onChange={(v) => onUpdate({ translation_end: v as [number, number, number] })}
        />
      </ChannelSection>

      {/* Scale channel */}
      <ChannelSection
        label='Scale'
        open={scaleOpen}
        onToggle={() => setScaleOpen(!scaleOpen)}
        easing={step.scale_easing}
        frequency={step.scale_frequency}
        alternateDirection={step.scale_alternate_direction}
        onEasingChange={(v) => onUpdate({ scale_easing: v })}
        onFrequencyChange={(v) => onUpdate({ scale_frequency: v })}
        onAlternateDirectionChange={(v) => onUpdate({ scale_alternate_direction: v })}
      >
        <Vec3Input
          label='Start'
          value={step.scale_start || [1, 1, 1]}
          onChange={(v) => onUpdate({ scale_start: v as [number, number, number] })}
        />
        <Vec3Input
          label='End'
          value={step.scale_end || [1, 1, 1]}
          onChange={(v) => onUpdate({ scale_end: v as [number, number, number] })}
        />
      </ChannelSection>
    </div>
  );
}

// ============================================================
// Channel Section (collapsible) for transform_matrix
// ============================================================

function ChannelSection({
  label,
  open,
  onToggle,
  easing,
  frequency,
  alternateDirection,
  onEasingChange,
  onFrequencyChange,
  onAlternateDirectionChange,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  easing?: EasingType;
  frequency?: number;
  alternateDirection?: boolean;
  onEasingChange: (v: EasingType) => void;
  onFrequencyChange: (v: number | undefined) => void;
  onAlternateDirectionChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className='border rounded p-2 space-y-1'>
      <button
        className='flex items-center gap-1 text-xs font-medium'
        onClick={onToggle}
      >
        {open ? <ChevronDownIcon className='size-3' /> : <ChevronRightIcon className='size-3' />}
        {label}
      </button>
      {open && (
        <div className='space-y-1 pl-4'>
          {children}
          <div className='flex gap-2 items-end'>
            <div className='w-28'>
              <Label className='text-[10px] text-muted-foreground'>Easing</Label>
              <Select value={easing || 'linear'} onValueChange={(v) => onEasingChange(v as EasingType)}>
                <SelectTrigger className='h-7 text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EASING_OPTIONS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='w-16'>
              <Label className='text-[10px] text-muted-foreground'>Freq</Label>
              <NumericInput
                className='h-7 text-xs no-spinners'
                placeholder='1'
                value={frequency ?? undefined}
                onChange={onFrequencyChange}
              />
            </div>
            <label className='flex items-center gap-1 text-[10px] pb-1'>
              <input
                type='checkbox'
                checked={alternateDirection ?? false}
                onChange={(e) => onAlternateDirectionChange(e.target.checked)}
                className='accent-primary'
              />
              Alt dir
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Advanced options (shared for all kinds)
// ============================================================

function AdvancedOptions({
  step,
  onUpdate,
}: {
  step: InterpolationStep;
  onUpdate: (updates: Partial<InterpolationStep>) => void;
}) {
  if (step.kind === 'transform_matrix') {
    // Transform matrix advanced options are in channel sections
    return (
      <div className='text-xs text-muted-foreground pl-2'>
        Advanced options for transform_matrix are in each channel section above.
      </div>
    );
  }

  const simple = step as SimpleInterpolationStep;

  return (
    <div className='grid grid-cols-3 gap-2 pl-2'>
      <div>
        <Label className='text-[10px] text-muted-foreground'>Frequency</Label>
        <NumericInput
          className='h-7 text-xs no-spinners'
          placeholder='1'
          value={simple.frequency ?? undefined}
          onChange={(v) => onUpdate({ frequency: v } as Partial<SimpleInterpolationStep>)}
        />
      </div>
      <div className='flex flex-col gap-1'>
        <label className='flex items-center gap-1 text-[10px] pt-3'>
          <input
            type='checkbox'
            checked={simple.alternate_direction ?? false}
            onChange={(e) => onUpdate({ alternate_direction: e.target.checked } as Partial<SimpleInterpolationStep>)}
            className='accent-primary'
          />
          Alternate direction
        </label>
      </div>
      <div>
        <Label className='text-[10px] text-muted-foreground'>Noise</Label>
        <NumericInput
          className='h-7 text-xs no-spinners'
          placeholder='0'
          value={simple.noise_magnitude ?? undefined}
          onChange={(v) => onUpdate({ noise_magnitude: v } as Partial<SimpleInterpolationStep>)}
        />
      </div>
      {simple.kind === 'scalar' && (
        <label className='flex items-center gap-1 text-[10px]'>
          <input
            type='checkbox'
            checked={simple.discrete ?? false}
            onChange={(e) => onUpdate({ discrete: e.target.checked } as Partial<SimpleInterpolationStep>)}
            className='accent-primary'
          />
          Discrete (round to int)
        </label>
      )}
      {simple.kind === 'vec3' && (
        <label className='flex items-center gap-1 text-[10px]'>
          <input
            type='checkbox'
            checked={simple.spherical ?? false}
            onChange={(e) => onUpdate({ spherical: e.target.checked } as Partial<SimpleInterpolationStep>)}
            className='accent-primary'
          />
          Spherical interpolation
        </label>
      )}
    </div>
  );
}

// ============================================================
// Vec3 Input helper
// ============================================================

function Vec3Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const update = (idx: number, val: number) => {
    const newVal = [...value];
    newVal[idx] = val;
    onChange(newVal);
  };

  return (
    <div className='flex gap-1 items-end'>
      <Label className='text-[10px] text-muted-foreground w-10 pb-1'>{label}</Label>
      {['X', 'Y', 'Z'].map((axis, i) => (
        <div key={axis} className='flex-1'>
          <Label className='text-[10px] text-muted-foreground'>{axis}</Label>
          <NumericInput
            className='h-7 text-xs no-spinners'
            value={value[i] ?? 0}
            onChange={(v) => update(i, v ?? 0)}
          />
        </div>
      ))}
    </div>
  );
}
