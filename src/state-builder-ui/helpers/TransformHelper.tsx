'use client';

import { useState } from 'react';
import { Label } from '../base/label.tsx';
import { Button } from '../base/button.tsx';
import { BoxIcon } from 'lucide-react';
import {
  TranslationPanel,
  RotationMatrixPanel,
  RotationPresetsPanel,
  EulerAnglesPanel,
  RotationCenterPanel,
  MatrixPanel,
  TransformPreview,
} from './transform-helper/index.ts';
import type { TransformParams } from './transform-helper/index.ts';
import { IDENTITY_3x3, eulerToMatrix, matrixToEuler } from '@molstar/state-builder';
import type { UINode } from '@molstar/state-builder';
import { NodeHelperBase } from './NodeHelperBase.tsx';

interface TransformHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onCustomChange?: (custom: unknown) => void;
}

export function TransformHelper({ node, onUpdate, open, onOpenChange, trigger, onCustomChange }: TransformHelperProps) {
  // Translation state
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [tz, setTz] = useState(0);

  // Rotation state (shared by matrix-3x3, presets, and euler tabs)
  const [rotationMatrix, setRotationMatrix] = useState<number[]>([...IDENTITY_3x3]);

  // Euler angles (derived from / synced with rotationMatrix)
  const [eulerRoll, setEulerRoll] = useState(0);
  const [eulerPitch, setEulerPitch] = useState(0);
  const [eulerYaw, setEulerYaw] = useState(0);

  // Rotation center state
  const [centerMode, setCenterMode] = useState<'none' | 'centroid' | 'custom'>('none');
  const [cx, setCx] = useState(0);
  const [cy, setCy] = useState(0);
  const [cz, setCz] = useState(0);

  // 4x4 matrix state
  const [fullMatrix, setFullMatrix] = useState<number[] | null>(null);

  const initialValue = node.params as Record<string, unknown> | undefined;

  // Reinit all state from node.params when dialog opens
  const handleDialogOpen = () => {
    if (initialValue) {
      const t = initialValue.translation as number[] | undefined;
      if (t && t.length >= 3) {
        setTx(t[0]); setTy(t[1]); setTz(t[2]);
      } else {
        setTx(0); setTy(0); setTz(0);
      }

      const r = initialValue.rotation as number[] | undefined;
      if (r && r.length === 9) {
        setRotationMatrix([...r]);
        const euler = matrixToEuler(r);
        setEulerRoll(euler.roll);
        setEulerPitch(euler.pitch);
        setEulerYaw(euler.yaw);
      } else {
        setRotationMatrix([...IDENTITY_3x3]);
        setEulerRoll(0); setEulerPitch(0); setEulerYaw(0);
      }

      const rc = initialValue.rotation_center;
      if (rc === 'centroid') {
        setCenterMode('centroid');
      } else if (Array.isArray(rc) && rc.length >= 3) {
        setCenterMode('custom');
        setCx(rc[0] as number); setCy(rc[1] as number); setCz(rc[2] as number);
      } else {
        setCenterMode('none');
        setCx(0); setCy(0); setCz(0);
      }

      const m = initialValue.matrix as number[] | null | undefined;
      if (m && m.length === 16) {
        setFullMatrix([...m]);
      } else {
        setFullMatrix(null);
      }
    } else {
      setTx(0); setTy(0); setTz(0);
      setRotationMatrix([...IDENTITY_3x3]);
      setEulerRoll(0); setEulerPitch(0); setEulerYaw(0);
      setCenterMode('none');
      setCx(0); setCy(0); setCz(0);
      setFullMatrix(null);
    }
  };

  // When rotation matrix changes (from matrix panel or presets), sync euler angles
  const handleRotationMatrixChange = (matrix: number[]) => {
    setRotationMatrix(matrix);
    const euler = matrixToEuler(matrix);
    setEulerRoll(euler.roll);
    setEulerPitch(euler.pitch);
    setEulerYaw(euler.yaw);
  };

  // When euler angles change, sync rotation matrix
  const handleEulerChange = (roll: number, pitch: number, yaw: number) => {
    setEulerRoll(roll);
    setEulerPitch(pitch);
    setEulerYaw(yaw);
    setRotationMatrix(eulerToMatrix(roll, pitch, yaw));
  };

  const buildTransformParams = (): TransformParams => {
    const params: TransformParams = {};

    if (tx !== 0 || ty !== 0 || tz !== 0) {
      params.translation = [tx, ty, tz];
    }

    const isIdentity = rotationMatrix.every((v, i) => Math.abs(v - IDENTITY_3x3[i]) < 1e-10);
    if (!isIdentity) {
      params.rotation = rotationMatrix;
    }

    if (centerMode === 'centroid') {
      params.rotation_center = 'centroid';
    } else if (centerMode === 'custom') {
      params.rotation_center = [cx, cy, cz];
    }

    if (fullMatrix) {
      params.matrix = fullMatrix;
    }

    return params;
  };

  const handleApply = (ref: string) => {
    const result = buildTransformParams();
    onUpdate({ params: result as Record<string, unknown>, ...(ref ? { ref } : {}) });
  };

  const handleRawApply = (params: Record<string, unknown>, ref: string) => {
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  // Shared preview widget used inside each tab
  const PreviewWidget = () => {
    const currentParams = buildTransformParams();
    const previewJson = JSON.stringify(currentParams, null, 2);
    return (
      <div className='flex gap-4'>
        <div className='w-1/3 shrink-0 flex items-start justify-center'>
          <TransformPreview
            rotation={rotationMatrix}
            translation={[tx, ty, tz]}
          />
        </div>
        <div className='flex-1 min-w-0'>
          <Label className='text-xs text-muted-foreground'>Preview</Label>
          <pre className='text-xs font-mono bg-muted p-2 rounded-md mt-1 overflow-auto max-h-24'>
            {previewJson}
          </pre>
        </div>
      </div>
    );
  };

  // Format a compact summary for the trigger button
  const formatPreview = (): string => {
    if (!initialValue) return 'Configure transform';
    const parts: string[] = [];
    if (initialValue.rotation) parts.push('rotation');
    if (initialValue.translation) parts.push('translation');
    if (initialValue.rotation_center) parts.push('center');
    if (initialValue.matrix) parts.push('4x4 matrix');
    return parts.length > 0 ? parts.join(' + ') : 'Configure transform';
  };

  const defaultTrigger = (
    <Button
      variant='outline'
      size='sm'
      className='h-8 justify-start text-left font-normal w-full'
      title='Open transform helper'
    >
      <BoxIcon className='size-4 mr-2 shrink-0' />
      <span className='truncate'>{formatPreview()}</span>
    </Button>
  );

  return (
    <NodeHelperBase
      node={node}
      onApply={handleApply}
      onRawApply={handleRawApply}
      onDialogOpen={handleDialogOpen}
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger ?? (open !== undefined ? undefined : defaultTrigger)}
      onCustomChange={onCustomChange}
      dialogContentClassName='sm:max-w-2xl'
      tabs={[
        {
          id: 'translation',
          label: 'Translate',
          content: (
            <div className='flex flex-col gap-4'>
              <TranslationPanel
                x={tx} y={ty} z={tz}
                onChange={(x, y, z) => { setTx(x); setTy(y); setTz(z); }}
              />
              <PreviewWidget />
            </div>
          ),
        },
        {
          id: 'matrix-3x3',
          label: 'Matrix 3x3',
          content: (
            <div className='flex flex-col gap-4'>
              <RotationMatrixPanel
                matrix={rotationMatrix}
                onChange={handleRotationMatrixChange}
              />
              <PreviewWidget />
            </div>
          ),
        },
        {
          id: 'presets',
          label: 'Presets',
          content: (
            <div className='flex flex-col gap-4'>
              <RotationPresetsPanel onSelect={handleRotationMatrixChange} />
              <PreviewWidget />
            </div>
          ),
        },
        {
          id: 'euler',
          label: 'Euler',
          content: (
            <div className='flex flex-col gap-4'>
              <EulerAnglesPanel
                roll={eulerRoll}
                pitch={eulerPitch}
                yaw={eulerYaw}
                onChange={handleEulerChange}
              />
              <PreviewWidget />
            </div>
          ),
        },
        {
          id: 'center',
          label: 'Center',
          content: (
            <div className='flex flex-col gap-4'>
              <RotationCenterPanel
                mode={centerMode}
                x={cx} y={cy} z={cz}
                onModeChange={setCenterMode}
                onCoordsChange={(x, y, z) => { setCx(x); setCy(y); setCz(z); }}
              />
              <PreviewWidget />
            </div>
          ),
        },
        {
          id: 'matrix-4x4',
          label: '4x4',
          content: (
            <div className='flex flex-col gap-4'>
              <MatrixPanel
                matrix={fullMatrix}
                onChange={setFullMatrix}
              />
              <PreviewWidget />
            </div>
          ),
        },
      ]}
    />
  );
}
