export interface VectorsPanelProps {
  direction: [number, number, number] | undefined;
  up: [number, number, number] | undefined;
  onDirectionChange: (v: [number, number, number] | undefined) => void;
  onUpChange: (v: [number, number, number] | undefined) => void;
}

export interface RadiusPanelProps {
  radiusFactor: number;
  radiusExtent: number;
  radius: number | null;
  onRadiusFactorChange: (v: number) => void;
  onRadiusExtentChange: (v: number) => void;
  onRadiusChange: (v: number | null) => void;
}

export interface PresetsPanelProps {
  onSelect: (direction: [number, number, number] | undefined, up: [number, number, number] | undefined) => void;
}
