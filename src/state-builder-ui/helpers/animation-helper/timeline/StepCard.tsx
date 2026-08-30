'use client';

import { Button } from '../../../base/button.tsx';
import { Input } from '../../../base/input.tsx';
import { Label } from '../../../base/label.tsx';
import { NumericInput } from '../../../components/NumericInput.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../base/select.tsx';
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, ChevronRightIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  INTERPOLATION_KINDS,
  KIND_COLORS,
  PROPERTY_KIND_MAP,
  filterRefsForKind,
  getAnimatableProperties,
} from '../../../../state-builder/index.ts';
import type {
  InterpolationStep,
  InterpolationKind,
  SimpleInterpolationStep,
  TransformMatrixInterpolationStep,
  RefInfo,
} from '../../../../state-builder/index.ts';
import { SimpleValueFields } from './SimpleValueFields.tsx';
import { TransformMatrixFields } from './TransformMatrixFields.tsx';
import { AdvancedOptions } from './AdvancedOptions.tsx';
import { EasingSelect } from './EasingSelect.tsx';

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

export function StepCard({
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
  const propertySuggestions = useMemo(
    () => getAnimatableProperties(selectedRefInfo?.kind, step.kind),
    [selectedRefInfo?.kind, step.kind],
  );
  const singleProperty = propertySuggestions.length === 1;
  const onlySuggestedValue = propertySuggestions[0]?.value;

  // Auto-select property when there's only one option
  useEffect(() => {
    if (singleProperty && onlySuggestedValue && step.property !== onlySuggestedValue) {
      onUpdate({ property: onlySuggestedValue });
    }
    // onUpdate is a fresh callback from the parent every render; only the
    // step's own kind/ref-derived state should retrigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleProperty, onlySuggestedValue, step.property]);

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
            <EasingSelect
              value={(step as SimpleInterpolationStep).easing}
              onChange={(v) => onUpdate({ easing: v } as Partial<SimpleInterpolationStep>)}
            />
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
