import type {
  AnimationParams,
  AnimationPreset,
  InterpolationStep,
  RefInfo,
  TrackballSpin,
} from '@molstar/state-builder';

export interface TimelinePanelProps {
  frameTimeMs: number | undefined;
  durationMs: number | null | undefined;
  autoplay: boolean;
  loop: boolean;
  includeCamera: boolean;
  includeCanvas: boolean;
  trackball: TrackballSpin;
  steps: InterpolationStep[];
  availableRefs: RefInfo[];
  onFrameTimeMsChange: (v: number | undefined) => void;
  onDurationMsChange: (v: number | null | undefined) => void;
  onAutoplayChange: (v: boolean) => void;
  onLoopChange: (v: boolean) => void;
  onIncludeCameraChange: (v: boolean) => void;
  onIncludeCanvasChange: (v: boolean) => void;
  onTrackballChange: (v: TrackballSpin) => void;
  onStepsChange: (steps: InterpolationStep[]) => void;
}

export interface PresetsPanelProps {
  availableRefs: RefInfo[];
  onApplyPreset: (preset: AnimationPreset, targetRef: string) => void;
}

export interface RawPanelProps {
  value: string;
  error: string;
  onChange: (value: string) => void;
}

export type { AnimationParams, InterpolationStep, TrackballSpin };
