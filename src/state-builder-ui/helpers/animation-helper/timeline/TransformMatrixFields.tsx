'use client';

import { useState } from 'react';
import { SliderAngleRow } from '../../../components/SliderAngleRow.tsx';
import { SliderVec3Row } from '../../../components/SliderVec3Row.tsx';
import { IDENTITY_3x3 } from '../../../../state-builder/index.ts';
import type { EasingType, TransformMatrixInterpolationStep } from '../../../../state-builder/index.ts';
import { toVec3 } from './utils.ts';
import { ChannelSection } from './ChannelSection.tsx';

type Channel = 'rotation' | 'translation' | 'scale';

/** Reads/writes the `{channel}_easing`/`_frequency`/`_alternate_direction`
 * trio that every channel carries, so the 3 <ChannelSection> call sites
 * below don't each hand-wire the same 6 props. */
function channelProps(
  step: TransformMatrixInterpolationStep,
  channel: Channel,
  onUpdate: (updates: Partial<TransformMatrixInterpolationStep>) => void,
) {
  const easingKey = `${channel}_easing` as const;
  const frequencyKey = `${channel}_frequency` as const;
  const alternateKey = `${channel}_alternate_direction` as const;
  return {
    easing: step[easingKey],
    frequency: step[frequencyKey],
    alternateDirection: step[alternateKey],
    onEasingChange: (v: EasingType) => onUpdate({ [easingKey]: v } as Partial<TransformMatrixInterpolationStep>),
    onFrequencyChange: (v: number | undefined) => onUpdate({ [frequencyKey]: v } as Partial<TransformMatrixInterpolationStep>),
    onAlternateDirectionChange: (v: boolean) => onUpdate({ [alternateKey]: v } as Partial<TransformMatrixInterpolationStep>),
  };
}

export function TransformMatrixFields({
  step,
  onUpdate,
}: {
  step: TransformMatrixInterpolationStep;
  onUpdate: (updates: Partial<TransformMatrixInterpolationStep>) => void;
}) {
  const [openChannel, setOpenChannel] = useState<Channel | null>(null);
  const toggle = (channel: Channel) => setOpenChannel(openChannel === channel ? null : channel);

  return (
    <div className='space-y-1'>
      {/* Pivot */}
      <SliderVec3Row
        label='Pivot'
        value={toVec3(step.pivot, [0, 0, 0])}
        onChange={(v) => onUpdate({ pivot: v })}
        defaultRange={[-100, 100]}
        initialMode='xyz'
      />

      {/* Rotation channel */}
      <ChannelSection
        label='Rotation'
        open={openChannel === 'rotation'}
        onToggle={() => toggle('rotation')}
        {...channelProps(step, 'rotation', onUpdate)}
      >
        <SliderAngleRow
          label='Start'
          matrix={step.rotation_start?.length === 9 ? step.rotation_start : IDENTITY_3x3}
          onChange={(m) => onUpdate({ rotation_start: m })}
        />
        <SliderAngleRow
          label='End'
          matrix={step.rotation_end?.length === 9 ? step.rotation_end : IDENTITY_3x3}
          onChange={(m) => onUpdate({ rotation_end: m })}
        />
      </ChannelSection>

      {/* Translation channel */}
      <ChannelSection
        label='Translation'
        open={openChannel === 'translation'}
        onToggle={() => toggle('translation')}
        {...channelProps(step, 'translation', onUpdate)}
      >
        <SliderVec3Row
          label='Start'
          value={toVec3(step.translation_start, [0, 0, 0])}
          onChange={(v) => onUpdate({ translation_start: v })}
          defaultRange={[-100, 100]}        />
        <SliderVec3Row
          label='End'
          value={toVec3(step.translation_end, [0, 0, 0])}
          onChange={(v) => onUpdate({ translation_end: v })}
          defaultRange={[-100, 100]}        />
      </ChannelSection>

      {/* Scale channel */}
      <ChannelSection
        label='Scale'
        open={openChannel === 'scale'}
        onToggle={() => toggle('scale')}
        {...channelProps(step, 'scale', onUpdate)}
      >
        <SliderVec3Row
          label='Start'
          value={toVec3(step.scale_start, [1, 1, 1])}
          onChange={(v) => onUpdate({ scale_start: v })}
          defaultRange={[0, 4]}        />
        <SliderVec3Row
          label='End'
          value={toVec3(step.scale_end, [1, 1, 1])}
          onChange={(v) => onUpdate({ scale_end: v })}
          defaultRange={[0, 4]}        />
      </ChannelSection>
    </div>
  );
}
