import type {
  AnimationParams,
  InterpolationStep,
  RefInfo,
  TrackballSpin,
} from '../../../state-builder/index.ts';

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

export type { AnimationParams, InterpolationStep, TrackballSpin };
