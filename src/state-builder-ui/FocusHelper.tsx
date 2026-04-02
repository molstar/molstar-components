'use client';

import { Button } from './ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx';
import { FocusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { VectorsPanel, RadiusPanel, PresetsPanel, FocusPreview, FOCUS_PRESETS } from './focus-helper/index.ts';

interface FocusHelperProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
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

export function FocusHelper({ params, onChange }: FocusHelperProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FocusTab>('vectors');

  const [direction, setDirection] = useState<[number, number, number] | undefined>(undefined);
  const [up, setUp] = useState<[number, number, number] | undefined>(undefined);
  const [radiusFactor, setRadiusFactor] = useState(1);
  const [radiusExtent, setRadiusExtent] = useState(0);
  const [radius, setRadius] = useState<number | null>(null);

  // Initialise local state from params when dialog opens
  useEffect(() => {
    if (!open) return;
    setDirection(params.direction as [number, number, number] | undefined);
    setUp(params.up as [number, number, number] | undefined);
    setRadiusFactor((params.radius_factor as number | undefined) ?? 1);
    setRadiusExtent((params.radius_extent as number | undefined) ?? 0);
    setRadius((params.radius as number | null | undefined) ?? null);
  }, [open, params]);

  const handlePresetSelect = (
    dir: [number, number, number] | undefined,
    upVec: [number, number, number] | undefined,
  ) => {
    setDirection(dir);
    setUp(upVec);
  };

  const handleApply = () => {
    const newParams: Record<string, unknown> = { ...params };

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

    onChange(newParams);
    setOpen(false);
  };

  const label = computeLabel(params);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8 justify-start text-left font-normal w-full'
          title='Open focus helper'
        >
          <FocusIcon className='size-4 mr-2 shrink-0 text-muted-foreground' />
          <span className='truncate'>{label}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Focus Helper</DialogTitle>
        </DialogHeader>

        <div className='flex gap-4'>
          {/* SVG preview — 1/3 width */}
          <div className='w-1/3 shrink-0 flex items-start justify-center pt-1'>
            <FocusPreview direction={direction} up={up} />
          </div>

          {/* Tabs — 2/3 width */}
          <div className='w-2/3 min-w-0'>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FocusTab)}>
              <TabsList className='w-full'>
                <TabsTrigger value='vectors' className='text-xs flex-1'>Vectors</TabsTrigger>
                <TabsTrigger value='presets' className='text-xs flex-1'>Presets</TabsTrigger>
                <TabsTrigger value='radius' className='text-xs flex-1'>Radius</TabsTrigger>
              </TabsList>

              <TabsContent value='vectors'>
                <VectorsPanel
                  direction={direction}
                  up={up}
                  onDirectionChange={setDirection}
                  onUpChange={setUp}
                />
              </TabsContent>

              <TabsContent value='presets'>
                <PresetsPanel onSelect={handlePresetSelect} />
              </TabsContent>

              <TabsContent value='radius'>
                <RadiusPanel
                  radiusFactor={radiusFactor}
                  radiusExtent={radiusExtent}
                  radius={radius}
                  onRadiusFactorChange={setRadiusFactor}
                  onRadiusExtentChange={setRadiusExtent}
                  onRadiusChange={setRadius}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className='flex gap-2 justify-end pt-2'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
