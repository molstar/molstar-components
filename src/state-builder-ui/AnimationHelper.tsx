'use client';

import { Button } from './ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog.tsx';
import { Label } from './ui/label.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx';
import { FilmIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  applyPreset,
  createDefaultAnimationParams,
} from '@molstar/state-builder';
import type {
  AnimationParams,
  AnimationPreset,
  InterpolationStep,
  RefInfo,
  TrackballSpin,
} from '@molstar/state-builder';
import { TimelinePanel, PresetsPanel, RawPanel } from './animation-helper/index.ts';

interface AnimationHelperProps {
  onApply: (params: AnimationParams) => void;
  initialValue?: AnimationParams | null;
  availableRefs: RefInfo[];
}

type AnimationTab = 'timeline' | 'presets' | 'raw';

export function AnimationHelper({ onApply, initialValue, availableRefs }: AnimationHelperProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AnimationTab>('timeline');

  // Animation settings state
  const [frameTimeMs, setFrameTimeMs] = useState<number | undefined>(undefined);
  const [durationMs, setDurationMs] = useState<number | null | undefined>(undefined);
  const [autoplay, setAutoplay] = useState(false);
  const [loop, setLoop] = useState(false);
  const [includeCamera, setIncludeCamera] = useState(false);
  const [includeCanvas, setIncludeCanvas] = useState(false);
  const [trackball, setTrackball] = useState<TrackballSpin>({ enabled: false, speed: -0.05 });
  const [steps, setSteps] = useState<InterpolationStep[]>([]);

  // Raw state
  const [rawInput, setRawInput] = useState('');
  const [rawError, setRawError] = useState('');

  // Sync state from initialValue on open
  useEffect(() => {
    if (!open) return;
    const src = initialValue ?? createDefaultAnimationParams();
    setFrameTimeMs(src.frame_time_ms);
    setDurationMs(src.duration_ms);
    setAutoplay(src.autoplay ?? false);
    setLoop(src.loop ?? false);
    setIncludeCamera(src.include_camera ?? false);
    setIncludeCanvas(src.include_canvas ?? false);
    setTrackball(src.trackball ?? { enabled: false, speed: -0.05 });
    setSteps([...src.steps]);
    setRawInput('');
    setRawError('');
  }, [open, initialValue]);

  const buildParams = (): AnimationParams => ({
    frame_time_ms: frameTimeMs,
    duration_ms: durationMs,
    autoplay,
    loop,
    include_camera: includeCamera,
    include_canvas: includeCanvas,
    trackball: trackball.enabled ? trackball : undefined,
    steps,
  });

  const handleApply = () => {
    if (activeTab === 'raw') {
      const trimmed = rawInput.trim();
      if (!trimmed) {
        setRawError('Empty input');
        return;
      }
      try {
        const parsed = JSON.parse(trimmed) as AnimationParams;
        if (!parsed.steps || !Array.isArray(parsed.steps)) {
          setRawError('Must include a "steps" array');
          return;
        }
        onApply(parsed);
        setOpen(false);
      } catch {
        setRawError('Invalid JSON');
        return;
      }
    } else {
      onApply(buildParams());
      setOpen(false);
    }
  };

  const handleApplyPreset = (preset: AnimationPreset, targetRef: string) => {
    const result = applyPreset(preset, targetRef);
    // Merge preset steps into existing steps
    setSteps([...steps, ...result.steps]);
    // Apply defaults
    if (result.defaults.autoplay !== undefined) setAutoplay(result.defaults.autoplay);
    if (result.defaults.loop !== undefined) setLoop(result.defaults.loop);
    if (result.defaults.duration_ms !== undefined) setDurationMs(result.defaults.duration_ms);
    if (result.defaults.trackball !== undefined) setTrackball(result.defaults.trackball);
    // Switch to timeline to see result
    setActiveTab('timeline');
  };

  const currentParams = buildParams();
  const previewJson = JSON.stringify(currentParams, null, 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8'
          title={initialValue ? 'Edit animation settings' : 'Set up animation'}
        >
          <FilmIcon className='size-4 mr-1' />
          {initialValue ? 'Edit' : 'Set Animation'}
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-4xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Animation Helper</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnimationTab)}>
          <TabsList>
            <TabsTrigger value='timeline'>Timeline</TabsTrigger>
            <TabsTrigger value='presets'>Presets</TabsTrigger>
            <TabsTrigger value='raw'>Raw</TabsTrigger>
          </TabsList>

          <TabsContent value='timeline'>
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
          </TabsContent>

          <TabsContent value='presets'>
            <div className='border rounded-md p-6 text-center text-sm text-muted-foreground'>
              Animation presets coming soon.
            </div>
          </TabsContent>

          <TabsContent value='raw'>
            <RawPanel
              value={rawInput}
              error={rawError}
              onChange={(v) => { setRawInput(v); setRawError(''); }}
            />
          </TabsContent>
        </Tabs>

        {/* Preview */}
        {activeTab !== 'raw' && (
          <div className='border-t pt-3'>
            <Label className='text-xs text-muted-foreground'>Preview</Label>
            <pre className='text-xs font-mono bg-muted p-2 rounded-md mt-1 overflow-auto max-h-32'>
              {previewJson}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-2 justify-end pt-2'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Animation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
