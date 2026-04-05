'use client';

import { useState } from 'react';
import {
  isConstantRef,
  createConstantRef,
  MOLSTAR_COLOR_THEMES,
  getActiveValues,
} from '@molstar/state-builder';
import type { UINode, ConstantDefinition, ConstantRef, ComponentSelectorValue } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import { SimplePanel, ThemePanel, ConstantPanel } from './color-helper/index.ts';
import { SelectorHelperContent } from './SelectorHelperContent.tsx';
import { ChevronRightIcon } from 'lucide-react';
import { cn } from './lib/utils.ts';

interface ColorHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  availableConstants?: ConstantDefinition[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onCustomChange?: (custom: unknown) => void;
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

  const sel = (params as Record<string, unknown>).selector;

  if (isConstantRef(params.color)) {
    const ref = params.color as ConstantRef;
    return {
      tab: 'constant' as ColorTab,
      simpleColor: '#808080',
      themeName: 'element-symbol',
      carbonColorName: 'element-symbol',
      carbonColorHex: '#808080',
      selectorValue: sel,
      constantValue: `${ref.constantName}:${ref.entryKey}`,
    };
  }
  if (custom?.molstar_color_theme_name !== undefined) {
    const themes = getActiveValues(MOLSTAR_COLOR_THEMES);
    const name = (custom.molstar_color_theme_name as string) || 'element-symbol';
    const themeParams = custom.molstar_color_theme_params as Record<string, unknown> | undefined;
    const carbonParam = themeParams?.carbonColor as { name?: string; params?: { value?: number } } | undefined;
    const carbonName = carbonParam?.name ?? 'element-symbol';
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
      selectorValue: sel,
      constantValue: '',
    };
  }
  // Simple color — stored as TColor string (hex/name); accept legacy numeric for back-compat
  const rawColor = params.color;
  const hex = typeof rawColor === 'string' ? rawColor
    : typeof rawColor === 'number' ? numericToHex(rawColor)
    : '#808080';
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

function CollapsibleSelector({
  value,
  onChange,
}: {
  value: ComponentSelectorValue | undefined;
  onChange: (v: ComponentSelectorValue | undefined) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasSelector = value !== undefined;
  return (
    <div className='border-t mt-3 pt-2'>
      <button
        type='button'
        className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
        onClick={() => setExpanded((o) => !o)}
      >
        <ChevronRightIcon className={cn('size-3 transition-transform', expanded && 'rotate-90')} />
        Selector
        {hasSelector && <span className='ml-1 size-1.5 rounded-full bg-primary inline-block' />}
      </button>
      {expanded && (
        <div className='mt-2'>
          <SelectorHelperContent value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

export function ColorHelper({
  node,
  onUpdate,
  availableConstants = [],
  open,
  onOpenChange,
  trigger,
  onCustomChange,
}: ColorHelperProps) {
  const init = initStateFromNode(node);
  const [activeTab, setActiveTab] = useState<ColorTab>(init.tab);
  const [simpleColor, setSimpleColor] = useState(init.simpleColor);
  const [themeName, setThemeName] = useState(init.themeName);
  const [carbonColorName, setCarbonColorName] = useState(init.carbonColorName);
  const [carbonColorHex, setCarbonColorHex] = useState(init.carbonColorHex);
  const [selectorValue, setSelectorValue] = useState<ComponentSelectorValue | undefined>(
    init.selectorValue as ComponentSelectorValue | undefined
  );
  const [constantValue, setConstantValue] = useState(init.constantValue);

  const colorConstants = availableConstants.filter((c) => c.type === 'colors');

  const handleDialogOpen = () => {
    const s = initStateFromNode(node);
    setActiveTab(s.tab);
    setSimpleColor(s.simpleColor);
    setThemeName(s.themeName);
    setCarbonColorName(s.carbonColorName);
    setCarbonColorHex(s.carbonColorHex);
    setSelectorValue(s.selectorValue as ComponentSelectorValue | undefined);
    setConstantValue(s.constantValue);
  };

  const handleApply = (ref: string) => {
    let newParams: Record<string, unknown> = {};
    let newCustom: Record<string, unknown> | undefined;

    if (activeTab === 'simple') {
      newParams = { color: simpleColor };
      if (selectorValue !== undefined) newParams.selector = selectorValue;
      newCustom = undefined;
    } else if (activeTab === 'theme') {
      const carbonNumeric = hexToNumeric(carbonColorHex);
      const defaultNumeric = 0;
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

  const selector = (
    <CollapsibleSelector
      value={selectorValue}
      onChange={setSelectorValue}
    />
  );

  return (
    <NodeHelperBase
      node={node}
      onApply={handleApply}
      onRawApply={handleRawApply}
      onDialogOpen={handleDialogOpen}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      onCustomChange={onCustomChange}
      defaultTab={activeTab}
      tabs={[
        {
          id: 'simple',
          label: 'Simple',
          content: (
            <div>
              <SimplePanel
                color={simpleColor}
                onChange={setSimpleColor}
              />
              {selector}
            </div>
          ),
        },
        {
          id: 'theme',
          label: 'Theme',
          content: (
            <div>
              <ThemePanel
                themeName={themeName}
                carbonColorName={carbonColorName}
                carbonColorHex={carbonColorHex}
                onThemeChange={setThemeName}
                onCarbonColorNameChange={setCarbonColorName}
                onCarbonColorHexChange={setCarbonColorHex}
              />
              {selector}
            </div>
          ),
        },
        {
          id: 'constant',
          label: 'Constant',
          content: (
            <div>
              <ConstantPanel
                value={constantValue}
                colorConstants={colorConstants}
                onChange={setConstantValue}
              />
              {selector}
            </div>
          ),
        },
      ]}
    />
  );
}
