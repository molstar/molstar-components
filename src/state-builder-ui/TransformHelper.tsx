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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx';
import { BoxIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  TranslationPanel,
  RotationMatrixPanel,
  RotationPresetsPanel,
  EulerAnglesPanel,
  RotationCenterPanel,
  MatrixPanel,
  RawPanel,
  TransformPreview,
} from './transform-helper/index.ts';
import type { TransformParams } from './transform-helper/index.ts';
import { IDENTITY_3x3, eulerToMatrix, matrixToEuler } from '@molstar/state-builder';

interface TransformHelperProps {
  onApply: (transform: TransformParams) => void;
  initialValue?: Record<string, unknown>;
}

type TransformTab = 'translation' | 'matrix-3x3' | 'presets' | 'euler' | 'center' | 'matrix-4x4' | 'raw';

export function TransformHelper({ onApply, initialValue }: TransformHelperProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TransformTab>('translation');

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

  // Raw state
  const [rawInput, setRawInput] = useState('');
  const [rawError, setRawError] = useState('');

  // Parse initial value when dialog opens
  useEffect(() => {
    if (!open) return;

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
      resetState();
    }
  }, [open, initialValue]);

  const resetState = () => {
    setTx(0); setTy(0); setTz(0);
    setRotationMatrix([...IDENTITY_3x3]);
    setEulerRoll(0); setEulerPitch(0); setEulerYaw(0);
    setCenterMode('none');
    setCx(0); setCy(0); setCz(0);
    setFullMatrix(null);
    setRawInput('');
    setRawError('');
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

    // Translation (only include if non-zero)
    if (tx !== 0 || ty !== 0 || tz !== 0) {
      params.translation = [tx, ty, tz];
    }

    // Rotation (only include if not identity)
    const isIdentity = rotationMatrix.every((v, i) => Math.abs(v - IDENTITY_3x3[i]) < 1e-10);
    if (!isIdentity) {
      params.rotation = rotationMatrix;
    }

    // Rotation center
    if (centerMode === 'centroid') {
      params.rotation_center = 'centroid';
    } else if (centerMode === 'custom') {
      params.rotation_center = [cx, cy, cz];
    }

    // 4x4 matrix (overrides rotation + translation)
    if (fullMatrix) {
      params.matrix = fullMatrix;
    }

    return params;
  };

  const handleApply = () => {
    if (activeTab === 'raw') {
      // Parse raw JSON
      const trimmed = rawInput.trim();
      if (!trimmed) {
        onApply({});
        setOpen(false);
        return;
      }
      try {
        const parsed = JSON.parse(trimmed);
        onApply(parsed);
        setOpen(false);
      } catch {
        setRawError('Invalid JSON');
        return;
      }
    } else {
      onApply(buildTransformParams());
      setOpen(false);
    }
  };

  const currentParams = buildTransformParams();
  const previewJson = JSON.stringify(currentParams, null, 2);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8 justify-start text-left font-normal w-full'
          title='Open transform helper'
        >
          <BoxIcon className='size-4 mr-2 shrink-0' />
          <span className='truncate'>{formatPreview()}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-4xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Transform Helper</DialogTitle>
        </DialogHeader>

        <div className='flex gap-4'>
          {/* SVG Preview - 1/3 width */}
          <div className='w-1/3 shrink-0 flex items-start justify-center'>
            <TransformPreview
              rotation={rotationMatrix}
              translation={[tx, ty, tz]}
            />
          </div>

          {/* Tabbed content - 2/3 width */}
          <div className='w-2/3 min-w-0'>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TransformTab)}>
              <TabsList className='w-full flex-wrap h-auto'>
                <TabsTrigger value='translation' className='text-xs'>Translate</TabsTrigger>
                <TabsTrigger value='matrix-3x3' className='text-xs'>Matrix 3x3</TabsTrigger>
                <TabsTrigger value='presets' className='text-xs'>Presets</TabsTrigger>
                <TabsTrigger value='euler' className='text-xs'>Euler</TabsTrigger>
                <TabsTrigger value='center' className='text-xs'>Center</TabsTrigger>
                <TabsTrigger value='matrix-4x4' className='text-xs'>4x4</TabsTrigger>
                <TabsTrigger value='raw' className='text-xs'>Raw</TabsTrigger>
              </TabsList>

              <TabsContent value='translation'>
                <TranslationPanel
                  x={tx} y={ty} z={tz}
                  onChange={(x, y, z) => { setTx(x); setTy(y); setTz(z); }}
                />
              </TabsContent>

              <TabsContent value='matrix-3x3'>
                <RotationMatrixPanel
                  matrix={rotationMatrix}
                  onChange={handleRotationMatrixChange}
                />
              </TabsContent>

              <TabsContent value='presets'>
                <RotationPresetsPanel onSelect={handleRotationMatrixChange} />
              </TabsContent>

              <TabsContent value='euler'>
                <EulerAnglesPanel
                  roll={eulerRoll}
                  pitch={eulerPitch}
                  yaw={eulerYaw}
                  onChange={handleEulerChange}
                />
              </TabsContent>

              <TabsContent value='center'>
                <RotationCenterPanel
                  mode={centerMode}
                  x={cx} y={cy} z={cz}
                  onModeChange={setCenterMode}
                  onCoordsChange={(x, y, z) => { setCx(x); setCy(y); setCz(z); }}
                />
              </TabsContent>

              <TabsContent value='matrix-4x4'>
                <MatrixPanel
                  matrix={fullMatrix}
                  onChange={setFullMatrix}
                />
              </TabsContent>

              <TabsContent value='raw'>
                <RawPanel
                  value={rawInput}
                  error={rawError}
                  onChange={(v) => { setRawInput(v); setRawError(''); }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Preview */}
        {activeTab !== 'raw' && (
          <div className='border-t pt-3'>
            <Label className='text-xs text-muted-foreground'>Preview</Label>
            <pre className='text-xs font-mono bg-muted p-2 rounded-md mt-1 overflow-auto max-h-24'>
              {previewJson}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-2 justify-end pt-2'>
          <Button
            variant='outline'
            onClick={() => { setOpen(false); resetState(); }}
          >
            Cancel
          </Button>
          <Button variant='ghost' onClick={resetState}>
            Clear All
          </Button>
          <Button onClick={handleApply}>
            Apply Transform
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
