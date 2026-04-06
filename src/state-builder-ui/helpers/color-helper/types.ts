import type { ConstantDefinition } from '@molstar/state-builder';

export interface SimplePanelProps {
  color: string;
  onChange: (color: string) => void;
}

export interface ThemePanelProps {
  themeName: string;
  carbonColorName: string;
  carbonColorHex: string;
  onThemeChange: (name: string) => void;
  onCarbonColorNameChange: (name: string) => void;
  onCarbonColorHexChange: (hex: string) => void;
}

export interface ConstantPanelProps {
  value: string;
  colorConstants: ConstantDefinition[];
  onChange: (value: string) => void;
}
