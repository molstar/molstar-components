'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '../../base/button.tsx';
import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import type { PositionEditorState } from './types.ts';
import { positionToParam, tryParseExpressionJson } from './types.ts';
import { SelectorHelperContent } from '../SelectorHelperContent.tsx';
import { useStructureMetadataContext } from '../../StructureMetadataContext.tsx';
import type { ComponentSelectorValue } from '../../../state-builder/index.ts';

interface PositionEditorProps {
  label: string;
  state: PositionEditorState;
  onChange: (state: PositionEditorState) => void;
}

export function PositionEditor({ label, state, onChange }: PositionEditorProps) {
  // localMode is decoupled from state.mode so that switching modes (e.g. to Raw Expr)
  // doesn't immediately propagate a value change that would snap the mode back.
  const [localMode, setLocalMode] = useState(state.mode);
  const [draft, setDraft] = useState(state.expressionJson);
  const metadataCtx = useStructureMetadataContext();

  // Track the last position value we emitted so we can distinguish external
  // parent changes (new primitive loaded, dialog re-opened) from our own echoes.
  const lastEmittedJsonRef = useRef(JSON.stringify(positionToParam(state)));

  useEffect(() => {
    const incomingJson = JSON.stringify(positionToParam(state));
    if (incomingJson !== lastEmittedJsonRef.current) {
      // Value changed from outside — re-sync mode and draft
      lastEmittedJsonRef.current = incomingJson;
      setLocalMode(state.mode);
      setDraft(state.expressionJson);
    }
  }, [state]);

  const emitChange = (newState: PositionEditorState) => {
    lastEmittedJsonRef.current = JSON.stringify(positionToParam(newState));
    onChange(newState);
  };

  const isDefaultExpression = localMode === 'expression' && draft.trim() === '{}';

  const handleSetMode = (mode: PositionEditorState['mode']) => {
    if (mode === localMode) return;
    setLocalMode(mode);
    // Don't emit onChange on mode switch — only emit when the user changes a value
    // within the new mode. This prevents the parent from re-deriving a different mode
    // before the user has had a chance to interact.
  };

  const handleAxis = (axis: 'x' | 'y' | 'z', str: string) => {
    emitChange({ ...state, mode: 'vec3', [axis]: parseFloat(str) || 0 });
  };

  return (
    <div className='space-y-1 rounded-md border bg-muted/20 px-2 pt-1.5 pb-2'>
      <div className='flex items-center gap-1'>
        <Label className='text-xs font-medium flex-1'>{label}</Label>
        {/* Mode toggle — three tab-style buttons */}
        <div className='flex items-center gap-0.5'>
          <Button
            size='sm'
            variant={localMode === 'selector' ? 'default' : 'ghost'}
            className='h-5 text-xs px-2'
            onClick={() => handleSetMode('selector')}
            title='Visual selector'
          >
            Selector
          </Button>
          <Button
            size='sm'
            variant={localMode === 'vec3' ? 'default' : 'ghost'}
            className='h-5 text-xs px-2'
            onClick={() => handleSetMode('vec3')}
            title='XYZ coordinates'
          >
            XYZ
          </Button>
          <Button
            size='sm'
            variant={localMode === 'expression' ? 'default' : 'ghost'}
            className='h-5 text-xs px-2'
            onClick={() => handleSetMode('expression')}
            title='ComponentExpression (raw JSON)'
          >
            Raw Expr
          </Button>
        </div>
        {/* Quick default {} button — only shown in expression mode when not already {} */}
        {localMode === 'expression' && !isDefaultExpression && (
          <Button
            size='sm'
            variant='ghost'
            className='h-5 text-xs px-2 text-muted-foreground'
            onClick={() => {
              setDraft('{}');
              emitChange({ ...state, mode: 'expression', expressionJson: '{}' });
            }}
            title='Reset to default expression {} (all atoms)'
          >
            {}
          </Button>
        )}
      </div>

      {localMode === 'selector' && (
        <SelectorHelperContent
          value={state.selectorValue}
          onChange={(v: ComponentSelectorValue | undefined) =>
            emitChange({ ...state, mode: 'selector', selectorValue: v })
          }
          metadata={metadataCtx?.metadata ?? undefined}
          hideMetadataStatus
          hidePreview
        />
      )}

      {localMode === 'vec3' && (
        <div className='grid grid-cols-3 gap-2'>
          {(['x', 'y', 'z'] as const).map((axis) => (
            <div key={axis}>
              <Label className='text-xs text-muted-foreground uppercase'>{axis}</Label>
              <Input
                className='h-8 text-sm font-mono'
                type='number'
                step='0.1'
                value={state[axis]}
                onChange={(e) => handleAxis(axis, e.target.value)}
                title={`${label} ${axis.toUpperCase()}`}
              />
            </div>
          ))}
        </div>
      )}

      {localMode === 'expression' && (
        <div className='space-y-1'>
          <textarea
            className='w-full min-h-[52px] text-xs font-mono border rounded-md p-2 bg-background resize-y'
            placeholder='{}'
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (tryParseExpressionJson(e.target.value) !== undefined) {
                emitChange({ ...state, mode: 'expression', expressionJson: e.target.value });
              }
            }}
            onBlur={() => {
              if (tryParseExpressionJson(draft) !== undefined) {
                emitChange({ ...state, mode: 'expression', expressionJson: draft });
              }
            }}
            title={`${label} ComponentExpression JSON`}
          />
          <p className='text-xs text-muted-foreground'>
            {isDefaultExpression
              ? '{} = all atoms (centroid). Add selectors to target specific atoms.'
              : 'ComponentExpression JSON — e.g. {"label_asym_id": "A"} for chain A'}
          </p>
        </div>
      )}
    </div>
  );
}
