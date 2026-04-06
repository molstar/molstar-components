'use client';

import { useEffect, useState } from 'react';
import { Button } from '../../base/button.tsx';
import { Input } from '../../base/input.tsx';
import { Label } from '../../base/label.tsx';
import type { PositionEditorState } from './types.ts';
import { defaultPositionState, tryParseExpressionJson } from './types.ts';

interface PositionEditorProps {
  label: string;
  state: PositionEditorState;
  onChange: (state: PositionEditorState) => void;
}

export function PositionEditor({ label, state, onChange }: PositionEditorProps) {
  const [draft, setDraft] = useState(state.expressionJson);

  // Sync draft when external state changes (mode switch, parent reset, future SelectorHelper)
  useEffect(() => {
    setDraft(state.expressionJson);
  }, [state.expressionJson]);
  const isDefaultExpression = state.mode === 'expression' && state.expressionJson.trim() === '{}';

  const toggleMode = () => {
    if (state.mode === 'vec3') {
      onChange({ ...state, mode: 'expression', expressionJson: '{}' });
    } else {
      // Try to parse expression as [x,y,z]
      try {
        const parsed = JSON.parse(state.expressionJson);
        if (Array.isArray(parsed) && parsed.length === 3) {
          onChange({ ...state, mode: 'vec3', x: parsed[0] ?? 0, y: parsed[1] ?? 0, z: parsed[2] ?? 0 });
          return;
        }
      } catch {
        // ignore
      }
      onChange({ ...defaultPositionState(), mode: 'vec3' });
    }
  };

  const handleAxis = (axis: 'x' | 'y' | 'z', str: string) => {
    onChange({ ...state, [axis]: parseFloat(str) || 0 });
  };

  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-1'>
        <Label className='text-xs font-medium flex-1'>{label}</Label>
        {/* Mode toggle — two tab-style buttons */}
        <div className='flex items-center gap-0.5'>
          <Button
            size='sm'
            variant={state.mode === 'vec3' ? 'default' : 'ghost'}
            className='h-5 text-xs px-2'
            onClick={() => state.mode !== 'vec3' && toggleMode()}
            title='XYZ coordinates'
          >
            XYZ
          </Button>
          <Button
            size='sm'
            variant={state.mode === 'expression' ? 'default' : 'ghost'}
            className='h-5 text-xs px-2'
            onClick={() => state.mode !== 'expression' && toggleMode()}
            title='ComponentExpression (selector)'
          >
            Expr
          </Button>
        </div>
        {/* Quick default {} button — only shown in expression mode when not already {} */}
        {state.mode === 'expression' && !isDefaultExpression && (
          <Button
            size='sm'
            variant='ghost'
            className='h-5 text-xs px-2 text-muted-foreground'
            onClick={() => onChange({ ...state, expressionJson: '{}' })}
            title='Reset to default expression {} (all atoms)'
          >
            {}
          </Button>
        )}
      </div>

      {state.mode === 'vec3' ? (
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
      ) : (
        <div className='space-y-1'>
          <textarea
            className='w-full min-h-[52px] text-xs font-mono border rounded-md p-2 bg-background resize-y'
            placeholder='{}'
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (tryParseExpressionJson(e.target.value) !== undefined) {
                onChange({ ...state, expressionJson: e.target.value });
              }
            }}
            onBlur={() => {
              // Only propagate on blur if parseable; otherwise leave params unchanged
              if (tryParseExpressionJson(draft) !== undefined) {
                onChange({ ...state, expressionJson: draft });
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
