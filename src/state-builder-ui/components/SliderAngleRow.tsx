'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '../base/label.tsx';
import { Button } from '../base/button.tsx';
import { NumericInput } from './NumericInput.tsx';
import { eulerToMatrix, matrixToEuler, isValidRotationMatrix, IDENTITY_3x3 } from '../../state-builder/index.ts';

interface SliderAngleRowProps {
  matrix: number[];
  onChange: (matrix: number[]) => void;
  label?: string;
}

const ANGLES = [
  { label: 'Roll (X)', key: 'roll' as const, color: '#ef4444' },
  { label: 'Pitch (Y)', key: 'pitch' as const, color: '#22c55e' },
  { label: 'Yaw (Z)', key: 'yaw' as const, color: '#3b82f6' },
];

function matricesEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-10);
}

export function SliderAngleRow({ matrix, onChange, label }: SliderAngleRowProps) {
  const [mode, setMode] = useState<'slider' | 'matrix'>('slider');

  // Keep euler angles as local state to avoid gimbal-lock discontinuities
  // when round-tripping through matrix → euler near ±90° pitch.
  const [euler, setEuler] = useState(() => matrixToEuler(matrix));
  const lastEmitted = useRef<number[]>(matrix);

  // Sync only when matrix changes externally (not from our own onChange calls).
  useEffect(() => {
    if (!matricesEqual(matrix, lastEmitted.current)) {
      setEuler(matrixToEuler(matrix));
      lastEmitted.current = matrix;
    }
  }, [matrix]);

  const { roll, pitch, yaw } = euler;

  const handleEulerChange = (key: 'roll' | 'pitch' | 'yaw', v: number) => {
    const next = { roll, pitch, yaw, [key]: v };
    setEuler(next);
    const newMatrix = eulerToMatrix(next.roll, next.pitch, next.yaw);
    lastEmitted.current = newMatrix;
    onChange(newMatrix);
  };

  const handleMatrixCell = (idx: number, v: number) => {
    const next = [...matrix];
    next[idx] = v;
    lastEmitted.current = next;
    onChange(next);
  };

  const isIdentity = matrix.every((v, i) => Math.abs(v - IDENTITY_3x3[i]) < 1e-10);
  const valid = isValidRotationMatrix(matrix);

  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-1'>
        <Label className='text-xs font-medium flex-1'>{label ?? 'Rotation'}</Label>
        <div className='flex items-center gap-0.5'>
          <Button
            size='sm'
            variant={mode === 'slider' ? 'default' : 'ghost'}
            className='h-5 text-xs px-2'
            onClick={() => setMode('slider')}
            title='Euler angle sliders'
          >
            Slider
          </Button>
          <Button
            size='sm'
            variant={mode === 'matrix' ? 'default' : 'ghost'}
            className='h-5 text-xs px-2'
            onClick={() => setMode('matrix')}
            title='Raw 3×3 rotation matrix'
          >
            Matrix
          </Button>
        </div>
      </div>

      {mode === 'slider' ? (
        <div className='space-y-1'>
          {ANGLES.map(({ label, key, color }) => (
            <div key={key} className='flex items-center gap-2'>
              <Label className='text-xs w-16 shrink-0' style={{ color }}>{label}</Label>
              <input
                type='range'
                min='-180'
                max='180'
                step='0.5'
                value={euler[key]}
                onChange={(e) => handleEulerChange(key, parseFloat(e.target.value))}
                className='flex-1 cursor-pointer'
                style={{ accentColor: color }}
                title={`${label}: ${euler[key].toFixed(1)}°`}
              />
              <span className='text-xs font-mono w-14 text-right tabular-nums' style={{ color }}>
                {euler[key].toFixed(1)}°
              </span>
            </div>
          ))}
          <p className='text-xs text-muted-foreground pt-0.5'>
            ZYX convention. Stored as 3×3 rotation matrix.
          </p>
        </div>
      ) : (
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            {!isIdentity && (
              <span className={`text-xs ${valid ? 'text-green-600' : 'text-amber-600'}`}>
                {valid ? 'Valid rotation' : 'Not a valid rotation matrix'}
              </span>
            )}
          </div>
          <div className='flex items-center gap-1'>
            <div className='border-l-2 border-t-2 border-b-2 border-foreground/30 w-1.5 self-stretch rounded-l-sm' />
            <div className='grid grid-cols-3 gap-1 flex-1'>
              {matrix.map((val, idx) => (
                <NumericInput
                  key={idx}
                  className='h-8 text-xs font-mono text-center no-spinners'
                  value={parseFloat(val.toFixed(6))}
                  onChange={(v) => { if (v !== undefined) handleMatrixCell(idx, v); }}
                  title={`[${idx}]`}
                />
              ))}
            </div>
            <div className='border-r-2 border-t-2 border-b-2 border-foreground/30 w-1.5 self-stretch rounded-r-sm' />
          </div>
          <p className='text-xs text-muted-foreground'>
            Values in flat array order, matching code representation.
          </p>
        </div>
      )}
    </div>
  );
}
