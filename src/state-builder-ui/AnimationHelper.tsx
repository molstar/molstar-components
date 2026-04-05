'use client';

import { Label } from './ui/label.tsx';
import { FilmIcon } from 'lucide-react';
import { useState } from 'react';
import {
  createDefaultAnimationParams,
} from '@molstar/state-builder';
import type {
  AnimationParams,
  InterpolationStep,
  RefInfo,
  TrackballSpin,
  UINode,
} from '@molstar/state-builder';
import { TimelinePanel } from './animation-helper/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';

export interface AnimationHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  availableRefs: RefInfo[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AnimationHelper({ node, onUpdate, availableRefs, open, onOpenChange, trigger }: AnimationHelperProps) {
  // Animation settings state
  const [frameTimeMs, setFrameTimeMs] = useState<number | undefined>(undefined);
  const [durationMs, setDurationMs] = useState<number | null | undefined>(undefined);
  const [autoplay, setAutoplay] = useState(false);
  const [loop, setLoop] = useState(false);
  const [includeCamera, setIncludeCamera] = useState(false);
  const [includeCanvas, setIncludeCanvas] = useState(false);
  const [trackball, setTrackball] = useState<TrackballSpin>({ enabled: false, speed: -0.05 });
  const [steps, setSteps] = useState<InterpolationStep[]>([]);

  const handleDialogOpen = () => {
    const src = (node.params as unknown as AnimationParams | null) ?? createDefaultAnimationParams();
    setFrameTimeMs(src.frame_time_ms);
    setDurationMs(src.duration_ms);
    setAutoplay(src.autoplay ?? false);
    setLoop(src.loop ?? false);
    setIncludeCamera(src.include_camera ?? false);
    setIncludeCanvas(src.include_canvas ?? false);
    setTrackball(src.trackball ?? { enabled: false, speed: -0.05 });
    setSteps([...(src.steps ?? [])]);
  };

  const buildAnimationParams = (): AnimationParams => ({
    frame_time_ms: frameTimeMs,
    duration_ms: durationMs,
    autoplay,
    loop,
    include_camera: includeCamera,
    include_canvas: includeCanvas,
    trackball: trackball.enabled ? trackball : undefined,
    steps,
  });

  const handleApply = (ref: string) => {
    const animParams = buildAnimationParams();
    onUpdate({ params: animParams as unknown as Record<string, unknown>, ...(ref ? { ref } : {}) });
  };

  const handleRawApply = (params: Record<string, unknown>, ref: string) => {
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  const currentParams = buildAnimationParams();
  const previewJson = JSON.stringify(currentParams, null, 2);

  const hasValue = (node.params as unknown as AnimationParams | null)?.steps?.length;
  const defaultTrigger = (
    <button
      className='inline-flex items-center gap-1 h-8 px-3 text-sm border rounded-md bg-background hover:bg-muted/50'
      title={hasValue ? 'Edit animation settings' : 'Set up animation'}
    >
      <FilmIcon className='size-4 mr-1' />
      {hasValue ? 'Edit' : 'Set Animation'}
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
      title='Animation Helper'
      defaultTab='timeline'
      dialogContentClassName='sm:max-w-2xl'
      tabs={[
        {
          id: 'timeline',
          label: 'Timeline',
          content: (
            <div className='space-y-3'>
              <TimelinePanel
                frameTimeMs={frameTimeMs}
                durationMs={durationMs}
                autoplay={autoplay}
                loop={loop}
                includeCamera={includeCamera}
                includeCanvas={includeCanvas}
                trackball={trackball}
                steps={steps}
                availableRefs={availableRefs}
                onFrameTimeMsChange={setFrameTimeMs}
                onDurationMsChange={setDurationMs}
                onAutoplayChange={setAutoplay}
                onLoopChange={setLoop}
                onIncludeCameraChange={setIncludeCamera}
                onIncludeCanvasChange={setIncludeCanvas}
                onTrackballChange={setTrackball}
                onStepsChange={setSteps}
              />
              <div className='border-t pt-3'>
                <Label className='text-xs text-muted-foreground'>Preview</Label>
                <pre className='text-xs font-mono bg-muted p-2 rounded-md mt-1 overflow-auto max-h-32'>
                  {previewJson}
                </pre>
              </div>
            </div>
          ),
        },
        {
          id: 'presets',
          label: 'Presets',
          content: (
            <div className='border rounded-md p-6 text-center text-sm text-muted-foreground'>
              Animation presets coming soon.
            </div>
          ),
        },
      ]}
    />
  );
}
