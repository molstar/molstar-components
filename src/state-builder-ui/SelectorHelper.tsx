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
  type SelectorBuilderMode,
  type StructureMetadata,
} from '@molstar/state-builder';
import { ListIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { useStructureMetadataContext } from './StructureMetadataContext.tsx';

interface SelectorHelperProps {
  onSelect: (selector: unknown) => void;
  initialValue?: unknown;
  preview?: string;
  metadata?: StructureMetadata;
}

const MODE_LABELS: { mode: SelectorBuilderMode; label: string }[] = [
  { mode: 'chain', label: 'Chain' },
  { mode: 'residue', label: 'Residue' },
  { mode: 'ligand', label: 'Ligand' },
  { mode: 'quick', label: 'Quick' },
  { mode: 'expression', label: 'Expression' },
  { mode: 'union', label: 'Union' },
  { mode: 'raw', label: 'Raw' },
];

export function SelectorHelper({ onSelect, initialValue, preview, metadata }: SelectorHelperProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SelectorBuilderMode>('chain');

  // Selection state
  const [selectedChain, setSelectedChain] = useState('');
  const [residueChain, setResidueChain] = useState('');
  const [residueFrom, setResidueFrom] = useState('');
  const [residueTo, setResidueTo] = useState('');
  const [ligandName, setLigandName] = useState('');
  const [ligandChain, setLigandChain] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [unionEntries, setUnionEntries] = useState<UnionEntry[]>([
    { id: '1', chain: '', from: '', to: '' },
  ]);
  const [expressionValue, setExpressionValue] = useState<ComponentSelectorObject>({});

  // Context and derived state
  const metadataContext = useStructureMetadataContext();
  const effectiveMetadata = metadata ?? metadataContext?.metadata ?? undefined;
  const availableChains = getAvailableChains(effectiveMetadata);
  const availableLigands = getAvailableLigands(effectiveMetadata);

  // Parse initial value when dialog opens
  useEffect(() => {
    if (open && initialValue) {
      const parsed = parseSelector(initialValue);
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
    }
  }, [open, initialValue]);

  const resetState = () => {
    setSelectedChain('');
    setResidueChain('');
    setResidueFrom('');
    setResidueTo('');
    setLigandName('');
    setLigandChain('');
    setRawInput('');
    setUnionEntries([{ id: '1', chain: '', from: '', to: '' }]);
    setExpressionValue({});
  };

  const buildSelector = (): { selector: unknown; valid: boolean; error?: string } => {
    switch (mode) {
      case 'chain':
        return selectedChain
          ? { selector: buildChainSelector(selectedChain), valid: true }
          : { selector: null, valid: false };
      case 'residue':
        if (residueChain && residueFrom) {
          const from = parseInt(residueFrom, 10);
          const to = residueTo ? parseInt(residueTo, 10) : undefined;
          return { selector: buildResidueSelector(residueChain, from, to), valid: true };
        }
        return { selector: null, valid: false };
      case 'ligand':
        return ligandName
          ? { selector: buildLigandSelector(ligandName, ligandChain || undefined), valid: true }
          : { selector: null, valid: false };
      case 'raw':
        if (rawInput.trim()) {
          const result = parseRawSelectorInput(rawInput);
          if (result.error) return { selector: null, valid: false, error: result.error };
          return { selector: result.value, valid: true };
        }
        return { selector: null, valid: false };
      case 'union': {
        const selectors = unionEntries
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
        return selectors.length > 0
          ? { selector: buildUnionSelector(selectors), valid: true }
          : { selector: null, valid: false };
      }
      case 'expression': {
        const hasAnyField = Object.keys(expressionValue).length > 0;
        return hasAnyField
          ? { selector: expressionValue, valid: true }
          : { selector: null, valid: false };
      }
      default:
        return { selector: null, valid: false };
    }
  };

  const applySelection = () => {
    const { selector, valid } = buildSelector();
    if (valid && selector !== null) {
      onSelect(selector);
      setOpen(false);
      resetState();
    }
  };

  const quickSelect = (value: string) => {
    onSelect(value);
    setOpen(false);
    resetState();
  };

  const { selector, valid, error: previewError } = buildSelector();
  const previewText = valid && selector !== null ? selectorToString(selector) : 'No selection';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {preview ? (
          <Button
            variant='outline'
            size='sm'
            className='h-8 justify-start text-left font-normal w-full'
            title='Open selector builder'
          >
            <ListIcon className='size-4 mr-2 shrink-0' />
            <span className='truncate'>{preview}</span>
          </Button>
        ) : (
          <Button variant='outline' size='sm' className='h-8 w-8 p-0' title='Open selector builder'>
            <ListIcon className='size-4' />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Build Component Selector</DialogTitle>
        </DialogHeader>

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
                  onClick={() => setMode(m)}
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
              onChainChange={setSelectedChain}
              availableChains={availableChains}
            />
          )}

          {mode === 'residue' && (
            <ResiduePanel
              chain={residueChain}
              from={residueFrom}
              to={residueTo}
              onChainChange={setResidueChain}
              onFromChange={setResidueFrom}
              onToChange={setResidueTo}
              availableChains={availableChains}
              metadata={effectiveMetadata}
            />
          )}

          {mode === 'ligand' && (
            <LigandPanel
              ligandName={ligandName}
              ligandChain={ligandChain}
              onNameChange={setLigandName}
              onChainChange={setLigandChain}
              availableLigands={availableLigands}
              availableChains={availableChains}
              hasMetadataLigands={!!effectiveMetadata?.ligands?.length}
            />
          )}

          {mode === 'quick' && <QuickPanel onSelect={quickSelect} />}

          {mode === 'raw' && (
            <RawPanel
              value={rawInput}
              error={previewError ?? ''}
              onChange={(v) => setRawInput(v)}
            />
          )}

          {mode === 'union' && (
            <UnionPanel
              entries={unionEntries}
              onChange={setUnionEntries}
              availableChains={availableChains}
            />
          )}

          {mode === 'expression' && (
            <ExpressionPanel value={expressionValue} onChange={setExpressionValue} />
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

          {/* Actions - not shown for quick mode */}
          {mode !== 'quick' && (
            <div className='flex gap-2 justify-end pt-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setOpen(false);
                  resetState();
                }}
              >
                Cancel
              </Button>
              <Button onClick={applySelection} disabled={!valid}>
                Apply Selection
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
