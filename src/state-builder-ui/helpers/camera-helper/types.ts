// Re-export data types from state-builder
export type { CameraParams, CameraPresetDef } from '../../../state-builder/index.ts';

/** Vectors panel props */
export interface VectorsPanelProps {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  onPositionChange: (v: [number, number, number]) => void;
  onTargetChange: (v: [number, number, number]) => void;
  onUpChange: (v: [number, number, number]) => void;
}

/** Presets panel props */
export interface PresetsPanelProps {
  onSelect: (params: import('../../../state-builder/index.ts').CameraParams) => void;
}

/** Camera preview props */
export interface CameraPreviewProps {
  position: [number, number, number];
  target: [number, number, number];
}
