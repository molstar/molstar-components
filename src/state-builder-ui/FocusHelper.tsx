'use client';

import { FocusIcon } from 'lucide-react';
import { useState } from 'react';
import { VectorsPanel, RadiusPanel, PresetsPanel, FocusPreview, FOCUS_PRESETS } from './focus-helper/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import type { UINode } from '@molstar/state-builder';

export interface FocusHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

type FocusTab = 'vectors' | 'presets' | 'radius';

function vectorEquals(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function computeLabel(params: Record<string, unknown>): string {
  const direction = params.direction as number[] | undefined;
  const radius = params.radius as number | null | undefined;
  const radiusFactor = (params.radius_factor as number | undefined) ?? 1;

  let dirLabel: string;
  if (!direction) {
    dirLabel = 'Auto focus';
  } else {
    const match = FOCUS_PRESETS.find((p) => p.direction && vectorEquals(p.direction, direction));
    dirLabel = match ? match.label : 'Custom direction';
  }

  let radiusSuffix = '';
  if (radius !== null && radius !== undefined) {
    radiusSuffix = ` · r=${radius}`;
  } else if (radiusFactor !== 1) {
    radiusSuffix = ` · ×${radiusFactor}`;
  }

  return dirLabel + radiusSuffix;
}

export function FocusHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: FocusHelperProps) {
  const [activeTab, setActiveTab] = useState<FocusTab>('vectors');

  const [direction, setDirection] = useState<[number, number, number] | undefined>(undefined);
  const [up, setUp] = useState<[number, number, number] | undefined>(undefined);
  const [radiusFactor, setRadiusFactor] = useState(1);
  const [radiusExtent, setRadiusExtent] = useState(0);
  const [radius, setRadius] = useState<number | null>(null);

  const handleDialogOpen = () => {
    const params = node.params;
    setDirection(params.direction as [number, number, number] | undefined);
    setUp(params.up as [number, number, number] | undefined);
    setRadiusFactor((params.radius_factor as number | undefined) ?? 1);
    setRadiusExtent((params.radius_extent as number | undefined) ?? 0);
    setRadius((params.radius as number | null | undefined) ?? null);
    setActiveTab('vectors');
  };

  const handlePresetSelect = (
    dir: [number, number, number] | undefined,
    upVec: [number, number, number] | undefined,
  ) => {
    setDirection(dir);
    setUp(upVec);
  };

  const handleApply = (ref: string) => {
    const newParams: Record<string, unknown> = { ...node.params };

    // Clear all focus-specific params first
    delete newParams.direction;
    delete newParams.up;
    delete newParams.radius_factor;
    delete newParams.radius_extent;
    delete newParams.radius;

    // Add back non-default values
    if (direction !== undefined) newParams.direction = direction;
    if (up !== undefined) newParams.up = up;

    if (radius !== null) {
      // Absolute mode
      newParams.radius = radius;
    } else {
      // Relative mode — omit if at default
      if (radiusFactor !== 1) newParams.radius_factor = radiusFactor;
      if (radiusExtent !== 0) newParams.radius_extent = radiusExtent;
    }

    onUpdate({ params: newParams, ...(ref ? { ref } : {}) });
  };

  const handleRawApply = (params: Record<string, unknown>, ref: string) => {
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  const label = computeLabel(node.params);
  const defaultTrigger = (
    <button
      className='inline-flex items-center gap-2 h-8 px-3 text-sm border rounded-md bg-background hover:bg-muted/50 w-full justify-start font-normal'
      title='Open focus helper'
    >
      <FocusIcon className='size-4 shrink-0 text-muted-foreground' />
      <span className='truncate'>{label}</span>
    </button>
  );

  return (
    <NodeHelperBase
      node={node}
      onApply={handleApply}
      onRawApply={handleRawApply}
      onDialogOpen={handleDialogOpen}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger ?? defaultTrigger}
      onCustomChange={onCustomChange}
      tabs={[
        {
          id: 'vectors',
          label: 'Vectors',
          content: (
            <div className='flex gap-4'>
              <div className='w-1/3 shrink-0 flex items-start justify-center pt-1'>
                <FocusPreview direction={direction} up={up} />
              </div>
              <div className='w-2/3 min-w-0'>
                <VectorsPanel
                  direction={direction}
                  up={up}
                  onDirectionChange={setDirection}
                  onUpChange={setUp}
                />
              </div>
            </div>
          ),
        },
        {
          id: 'presets',
          label: 'Presets',
          content: (
            <div className='flex gap-4'>
              <div className='w-1/3 shrink-0 flex items-start justify-center pt-1'>
                <FocusPreview direction={direction} up={up} />
              </div>
              <div className='w-2/3 min-w-0'>
                <PresetsPanel onSelect={handlePresetSelect} />
              </div>
            </div>
          ),
        },
        {
          id: 'radius',
          label: 'Radius',
          content: (
            <RadiusPanel
              radiusFactor={radiusFactor}
              radiusExtent={radiusExtent}
              radius={radius}
              onRadiusFactorChange={setRadiusFactor}
              onRadiusExtentChange={setRadiusExtent}
              onRadiusChange={setRadius}
            />
          ),
        },
      ]}
      defaultTab={activeTab}
    />
  );
}
