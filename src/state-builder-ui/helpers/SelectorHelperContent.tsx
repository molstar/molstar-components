'use client';

import { useEffect, useRef, useState } from 'react';
import { Label } from '../base/label.tsx';
import { Button } from '../base/button.tsx';
import {
  buildChainSelector,
  buildLigandSelector,
  buildResidueSelector,
  buildUnionSelector,
  getAvailableChains,
  getAvailableLigands,
  parseRawSelectorInput,
  parseSelector,
  selectorToString,
  type ComponentSelectorObject,
  type ComponentSelectorValue,
  type SelectorBuilderMode,
  type StructureMetadata,
} from '@molstar/state-builder';
import {
  ChainPanel,
  ExpressionPanel,
  LigandPanel,
  MetadataStatus,
  QuickPanel,
  RawPanel,
  ResiduePanel,
  UnionPanel,
  type UnionEntry,
} from './selector-helper/index.ts';
import { useStructureMetadataContext } from '../StructureMetadataContext.tsx';

export type SelectorTab = SelectorBuilderMode;

export interface SelectorHelperContentProps {
  value: ComponentSelectorValue | undefined;
  onChange: (selector: ComponentSelectorValue | undefined) => void;
  metadata?: StructureMetadata;
  activeTab?: SelectorTab;
  onTabChange?: (tab: SelectorTab) => void;
}

const MODE_LABELS: { mode: SelectorBuilderMode; label: string }[] = [
  { mode: 'quick', label: 'Quick' },
  { mode: 'chain', label: 'Chain' },
  { mode: 'residue', label: 'Residue' },
  { mode: 'ligand', label: 'Ligand' },
  { mode: 'expression', label: 'Expression' },
  { mode: 'union', label: 'Union' },
];

export function SelectorHelperContent({
  value,
  onChange,
  metadata,
  activeTab,
  onTabChange,
}: SelectorHelperContentProps) {
  const lastEmittedRef = useRef<ComponentSelectorValue | undefined>(value);
  const [internalMode, setInternalMode] = useState<SelectorBuilderMode>('chain');
  const mode = activeTab ?? internalMode;
  const setMode = (m: SelectorBuilderMode) => {
    if (onTabChange) onTabChange(m);
    else setInternalMode(m);
  };

  // Per-tab form fields
  const [selectedChain, setSelectedChain] = useState('');
  const [residueChain, setResidueChain] = useState('');
  const [residueFrom, setResidueFrom] = useState('');
  const [residueTo, setResidueTo] = useState('');
  const [ligandName, setLigandName] = useState('');
  const [ligandChain, setLigandChain] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [rawError, setRawError] = useState('');
  const [unionEntries, setUnionEntries] = useState<UnionEntry[]>([
    { id: '1', chain: '', from: '', to: '' },
  ]);
  const [expressionValue, setExpressionValue] = useState<ComponentSelectorObject>({});

  // Context and derived state
  const metadataContext = useStructureMetadataContext();
  const effectiveMetadata = metadata ?? metadataContext?.metadata ?? undefined;
  const availableChains = getAvailableChains(effectiveMetadata);
  const availableLigands = getAvailableLigands(effectiveMetadata);

  // Sync internal state from value prop
  useEffect(() => {
    // Skip sync when the value came from our own onChange call.
    if (value === lastEmittedRef.current) return;
    if (value === undefined) return;
    const parsed = parseSelector(value);
    setMode(parsed.mode);
    switch (parsed.mode) {
      case 'chain':
        setSelectedChain(parsed.chainId || '');
        break;
      case 'residue':
        setResidueChain(parsed.chainId || '');
        setResidueFrom(parsed.residueFrom?.toString() || '');
        setResidueTo(parsed.residueTo?.toString() || '');
        break;
      case 'ligand':
        setLigandName(parsed.ligandName || '');
        setLigandChain(parsed.ligandChain || '');
        break;
      case 'raw':
        setRawInput(parsed.rawValue || '');
        break;
      case 'union':
        if (parsed.unionEntries) {
          setUnionEntries(
            parsed.unionEntries.map((e, i) => ({
              id: String(i + 1),
              chain: e.chain,
              from: e.from !== undefined ? String(e.from) : '',
              to: e.to !== undefined ? String(e.to) : '',
            }))
          );
        }
        break;
      case 'expression':
        setExpressionValue(parsed.expressionValue ?? {});
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Build and emit selector when field values change
  const buildAndEmit = (overrides?: {
    chain?: string;
    rChain?: string; rFrom?: string; rTo?: string;
    lName?: string; lChain?: string;
    raw?: string;
    union?: UnionEntry[];
    expr?: ComponentSelectorObject;
    currentMode?: SelectorBuilderMode;
  }) => {
    const m = overrides?.currentMode ?? mode;
    const chain = overrides?.chain ?? selectedChain;
    const rChain = overrides?.rChain ?? residueChain;
    const rFrom = overrides?.rFrom ?? residueFrom;
    const rTo = overrides?.rTo ?? residueTo;
    const lName = overrides?.lName ?? ligandName;
    const lChain = overrides?.lChain ?? ligandChain;
    const raw = overrides?.raw ?? rawInput;
    const union = overrides?.union ?? unionEntries;
    const expr = overrides?.expr ?? expressionValue;

    const emit = (v: ComponentSelectorValue | undefined) => {
      lastEmittedRef.current = v;
      onChange(v);
    };

    switch (m) {
      case 'chain':
        emit(chain ? buildChainSelector(chain) : undefined);
        break;
      case 'residue':
        if (rChain && rFrom) {
          const from = parseInt(rFrom, 10);
          const to = rTo ? parseInt(rTo, 10) : undefined;
          emit(buildResidueSelector(rChain, from, to));
        } else {
          emit(undefined);
        }
        break;
      case 'ligand':
        emit(lName ? buildLigandSelector(lName, lChain || undefined) : undefined);
        break;
      case 'raw': {
        if (raw.trim()) {
          const result = parseRawSelectorInput(raw);
          if (result.error) {
            setRawError(result.error);
            emit(undefined);
          } else {
            setRawError('');
            emit(result.value as ComponentSelectorValue);
          }
        } else {
          emit(undefined);
        }
        break;
      }
      case 'union': {
        const selectors = union
          .filter((e) => e.chain.trim())
          .map((e) => {
            if (e.from) {
              return buildResidueSelector(
                e.chain,
                parseInt(e.from, 10),
                e.to ? parseInt(e.to, 10) : undefined
              );
            }
            return buildChainSelector(e.chain);
          });
        emit(selectors.length > 0 ? buildUnionSelector(selectors) : undefined);
        break;
      }
      case 'expression': {
        const hasAnyField = Object.keys(expr).length > 0;
        emit(hasAnyField ? expr : undefined);
        break;
      }
      case 'quick':
        // Quick mode emits on quickSelect below
        break;
    }
  };

  const handleChainChange = (v: string) => {
    setSelectedChain(v);
    buildAndEmit({ chain: v });
  };
  const handleResidueChainChange = (v: string) => {
    setResidueChain(v);
    buildAndEmit({ rChain: v });
  };
  const handleResidueFromChange = (v: string) => {
    setResidueFrom(v);
    buildAndEmit({ rFrom: v });
  };
  const handleResidueToChange = (v: string) => {
    setResidueTo(v);
    buildAndEmit({ rTo: v });
  };
  const handleLigandNameChange = (v: string) => {
    setLigandName(v);
    buildAndEmit({ lName: v });
  };
  const handleLigandChainChange = (v: string) => {
    setLigandChain(v);
    buildAndEmit({ lChain: v });
  };
  const handleRawChange = (v: string) => {
    setRawInput(v);
    buildAndEmit({ raw: v });
  };
  const handleUnionChange = (entries: UnionEntry[]) => {
    setUnionEntries(entries);
    buildAndEmit({ union: entries });
  };
  const handleExpressionChange = (expr: ComponentSelectorObject) => {
    setExpressionValue(expr);
    buildAndEmit({ expr });
  };

  const handleModeChange = (m: SelectorBuilderMode) => {
    setMode(m);
    buildAndEmit({ currentMode: m });
  };

  const quickSelect = (v: string) => {
    onChange(v as ComponentSelectorValue);
  };

  // Preview
  const previewText = value !== undefined ? selectorToString(value) : 'No selection';

  return (
    <div className='space-y-4'>
      {/* Metadata status */}
      {metadataContext && (
        <MetadataStatus
          metadata={effectiveMetadata ?? null}
          isLoading={metadataContext.isLoading}
          hasStructures={metadataContext.hasStructures}
          error={metadataContext.error}
          onLoadMetadata={metadataContext.loadMetadata}
          onGenerateAndLoad={metadataContext.generateAndLoad}
          onRefreshMetadata={metadataContext.loadMetadata}
          onClearMetadata={metadataContext.clearMetadata}
        />
      )}

      {/* Mode selector */}
      <div>
        <Label className='text-sm'>Selection Type</Label>
        <div className='flex flex-wrap gap-2 mt-2'>
          {MODE_LABELS.map(({ mode: m, label }) => (
            <Button
              key={m}
              size='sm'
              variant={mode === m ? 'default' : 'outline'}
              onClick={() => handleModeChange(m)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Mode-specific panels */}
      {mode === 'chain' && (
        <ChainPanel
          selectedChain={selectedChain}
          onChainChange={handleChainChange}
          availableChains={availableChains}
        />
      )}

      {mode === 'residue' && (
        <ResiduePanel
          chain={residueChain}
          from={residueFrom}
          to={residueTo}
          onChainChange={handleResidueChainChange}
          onFromChange={handleResidueFromChange}
          onToChange={handleResidueToChange}
          availableChains={availableChains}
          metadata={effectiveMetadata}
        />
      )}

      {mode === 'ligand' && (
        <LigandPanel
          ligandName={ligandName}
          ligandChain={ligandChain}
          onNameChange={handleLigandNameChange}
          onChainChange={handleLigandChainChange}
          availableLigands={availableLigands}
          availableChains={availableChains}
          hasMetadataLigands={!!effectiveMetadata?.ligands?.length}
        />
      )}

      {mode === 'quick' && <QuickPanel onSelect={quickSelect} />}

      {mode === 'raw' && (
        <RawPanel
          value={rawInput}
          error={rawError}
          onChange={handleRawChange}
        />
      )}

      {mode === 'union' && (
        <UnionPanel
          entries={unionEntries}
          onChange={handleUnionChange}
          availableChains={availableChains}
        />
      )}

      {mode === 'expression' && (
        <ExpressionPanel value={expressionValue} onChange={handleExpressionChange} />
      )}

      {/* Preview - not shown for quick mode */}
      {mode !== 'quick' && (
        <div className='border-t pt-3'>
          <Label className='text-xs text-muted-foreground'>Preview</Label>
          <pre className='text-sm font-mono bg-muted p-2 rounded-md mt-1 overflow-auto max-h-20'>
            {previewText}
          </pre>
        </div>
      )}
    </div>
  );
}
