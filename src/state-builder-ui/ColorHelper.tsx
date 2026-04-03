'use client';

import { useState } from 'react';
import {
  isConstantRef,
  createConstantRef,
  MOLSTAR_COLOR_THEMES,
  CARBON_COLOR_OPTIONS,
  getActiveValues,
} from '@molstar/state-builder';
import type { UINode, ConstantDefinition, ConstantRef } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import { SimplePanel, ThemePanel, ConstantPanel } from './color-helper/index.ts';

interface ColorHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  availableConstants?: ConstantDefinition[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

type ColorTab = 'simple' | 'theme' | 'constant';

function numericToHex(value: number): string {
  return '#' + value.toString(16).padStart(6, '0');
}

function hexToNumeric(hex: string): number {
  return parseInt(hex.replace('#', ''), 16) || 0;
}

function initStateFromNode(node: UINode) {
  const params = node.params;
  const custom = node.custom;

  if (isConstantRef(params.color)) {
    const ref = params.color as ConstantRef;
    return {
      tab: 'constant' as ColorTab,
      simpleColor: '#808080',
      themeName: 'element-symbol',
      carbonColorName: 'element-symbol',
      carbonColorHex: '#808080',
      selectorValue: undefined as unknown,
      constantValue: `${ref.constantName}:${ref.entryKey}`,
    };
  }
  if (custom?.molstar_color_theme_name !== undefined) {
    const themes = getActiveValues(MOLSTAR_COLOR_THEMES);
    const carbonOptions = getActiveValues(CARBON_COLOR_OPTIONS);
    const name = (custom.molstar_color_theme_name as string) || 'element-symbol';
    const themeParams = custom.molstar_color_theme_params as Record<string, unknown> | undefined;
    const carbonParam = themeParams?.carbonColor as { name?: string; params?: { value?: number } } | undefined;
    const carbonName = carbonParam?.name ?? 'element-symbol';
    const carbonOption = carbonOptions.find((o) => o.value === carbonName);
    const carbonHex = carbonParam?.params?.value !== undefined
      ? numericToHex(carbonParam.params.value)
      : '#808080';
    const carbonColorValid = themes.find((t) => t.value === name)
      ? carbonName
      : 'element-symbol';
    return {
      tab: 'theme' as ColorTab,
      simpleColor: '#808080',
      themeName: name,
      carbonColorName: carbonColorValid,
      carbonColorHex: carbonHex,
      selectorValue: undefined as unknown,
      constantValue: '',
    };
  }
  // Simple color
  const colorNum = params.color as number | undefined;
  const hex = typeof colorNum === 'number' ? numericToHex(colorNum) : '#808080';
  const sel = (params as Record<string, unknown>).selector;
  return {
    tab: 'simple' as ColorTab,
    simpleColor: hex,
    themeName: 'element-symbol',
    carbonColorName: 'element-symbol',
    carbonColorHex: '#808080',
    selectorValue: sel,
    constantValue: '',
  };
}

export function ColorHelper({
  node,
  onUpdate,
  availableConstants = [],
  open,
  onOpenChange,
  trigger,
}: ColorHelperProps) {
  const init = initStateFromNode(node);
  const [activeTab, setActiveTab] = useState<ColorTab>(init.tab);
  const [simpleColor, setSimpleColor] = useState(init.simpleColor);
  const [themeName, setThemeName] = useState(init.themeName);
  const [carbonColorName, setCarbonColorName] = useState(init.carbonColorName);
  const [carbonColorHex, setCarbonColorHex] = useState(init.carbonColorHex);
  const [selectorValue, setSelectorValue] = useState<unknown>(init.selectorValue);
  const [constantValue, setConstantValue] = useState(init.constantValue);

  const colorConstants = availableConstants.filter((c) => c.type === 'colors');

  const handleDialogOpen = () => {
    const s = initStateFromNode(node);
    setActiveTab(s.tab);
    setSimpleColor(s.simpleColor);
    setThemeName(s.themeName);
    setCarbonColorName(s.carbonColorName);
    setCarbonColorHex(s.carbonColorHex);
    setSelectorValue(s.selectorValue);
    setConstantValue(s.constantValue);
  };

  const handleApply = (ref: string) => {
    let newParams: Record<string, unknown> = {};
    let newCustom: Record<string, unknown> | undefined;

    if (activeTab === 'simple') {
      newParams = { color: hexToNumeric(simpleColor) };
      if (selectorValue !== undefined) newParams.selector = selectorValue;
      newCustom = undefined;
    } else if (activeTab === 'theme') {
      const carbonOptions = getActiveValues(CARBON_COLOR_OPTIONS);
      const carbonOption = carbonOptions.find((o) => o.value === carbonColorName);
      const carbonNumeric = hexToNumeric(carbonColorHex);
      const defaultNumeric = 0; // CARBON_COLOR_OPTIONS has no defaultValue; 0 means no override
      const carbonParams =
        carbonNumeric !== defaultNumeric ? { value: carbonNumeric } : undefined;
      newParams = {};
      if (selectorValue !== undefined) newParams.selector = selectorValue;
      newCustom = {
        molstar_color_theme_name: themeName,
        molstar_color_theme_params: {
          carbonColor: {
            name: carbonColorName,
            ...(carbonParams && { params: carbonParams }),
          },
        },
      };
    } else if (activeTab === 'constant') {
      const [cName, cKey] = constantValue.split(':');
      if (cName && cKey) {
        newParams = { color: createConstantRef(cName, cKey) };
      }
      if (selectorValue !== undefined) newParams.selector = selectorValue;
      newCustom = undefined;
    }

    onUpdate({
      params: newParams,
      custom: newCustom,
      ...(ref ? { ref } : {}),
    });
  };

  const handleRawApply = (params: Record<string, unknown>, ref: string) => {
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  return (
    <NodeHelperBase
      node={node}
      onApply={handleApply}
      onRawApply={handleRawApply}
      onDialogOpen={handleDialogOpen}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      defaultTab={activeTab}
      tabs={[
        {
          id: 'simple',
          label: 'Simple',
          content: (
            <SimplePanel
              color={simpleColor}
              onChange={setSimpleColor}
            />
          ),
        },
        {
          id: 'theme',
          label: 'Theme',
          content: (
            <ThemePanel
              themeName={themeName}
              carbonColorName={carbonColorName}
              carbonColorHex={carbonColorHex}
              onThemeChange={setThemeName}
              onCarbonColorNameChange={setCarbonColorName}
              onCarbonColorHexChange={setCarbonColorHex}
            />
          ),
        },
        {
          id: 'constant',
          label: 'Constant',
          content: (
            <ConstantPanel
              value={constantValue}
              colorConstants={colorConstants}
              onChange={setConstantValue}
            />
          ),
        },
      ]}
    />
  );
}
