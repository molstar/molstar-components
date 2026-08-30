'use client';

import { useState } from 'react';
import { SliderAngleRow } from '../../../components/SliderAngleRow.tsx';
import { SliderVec3Row } from '../../../components/SliderVec3Row.tsx';
import { IDENTITY_3x3 } from '../../../../state-builder/index.ts';
import type { TransformMatrixInterpolationStep } from '../../../../state-builder/index.ts';
import { toVec3 } from './utils.ts';
import { ChannelSection } from './ChannelSection.tsx';

export function TransformMatrixFields({
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
        open={rotOpen}
        onToggle={() => setRotOpen(!rotOpen)}
        easing={step.rotation_easing}
        frequency={step.rotation_frequency}
        alternateDirection={step.rotation_alternate_direction}
        onEasingChange={(v) => onUpdate({ rotation_easing: v })}
        onFrequencyChange={(v) => onUpdate({ rotation_frequency: v })}
        onAlternateDirectionChange={(v) => onUpdate({ rotation_alternate_direction: v })}
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
        open={transOpen}
        onToggle={() => setTransOpen(!transOpen)}
        easing={step.translation_easing}
        frequency={step.translation_frequency}
        alternateDirection={step.translation_alternate_direction}
        onEasingChange={(v) => onUpdate({ translation_easing: v })}
        onFrequencyChange={(v) => onUpdate({ translation_frequency: v })}
        onAlternateDirectionChange={(v) => onUpdate({ translation_alternate_direction: v })}
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
        open={scaleOpen}
        onToggle={() => setScaleOpen(!scaleOpen)}
        easing={step.scale_easing}
        frequency={step.scale_frequency}
        alternateDirection={step.scale_alternate_direction}
        onEasingChange={(v) => onUpdate({ scale_easing: v })}
        onFrequencyChange={(v) => onUpdate({ scale_frequency: v })}
        onAlternateDirectionChange={(v) => onUpdate({ scale_alternate_direction: v })}
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
