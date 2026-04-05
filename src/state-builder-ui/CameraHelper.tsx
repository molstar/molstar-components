'use client';

import { Button } from './ui/button.tsx';
import { Label } from './ui/label.tsx';
import { CameraIcon, CrosshairIcon } from 'lucide-react';
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { CameraSnapshotAtom } from './state/atoms.ts';
import type { CameraData } from '@molstar/state-builder';
import { snapshotToCameraParams, isDefaultUp } from '@molstar/state-builder';
import {
  VectorsPanel,
  PresetsPanel,
  RawPanel,
  CameraPreview,
} from './camera-helper/index.ts';
import type { CameraParams } from './camera-helper/index.ts';
import { NodeHelperBase } from './NodeHelperBase.tsx';
import type { UINode } from '@molstar/state-builder';

export interface CameraHelperProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CameraHelper({ node, onUpdate, open, onOpenChange, trigger }: CameraHelperProps) {
  const cameraSnapshot = useAtomValue(CameraSnapshotAtom);

  // Vector state
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 100]);
  const [target, setTarget] = useState<[number, number, number]>([0, 0, 0]);
  const [up, setUp] = useState<[number, number, number]>([0, 1, 0]);

  const handleDialogOpen = () => {
    const p = node.params;
    if (p.position && Array.isArray(p.position)) {
      setPosition([...(p.position as [number, number, number])]);
    } else {
      setPosition([0, 0, 100]);
    }
    if (p.target && Array.isArray(p.target)) {
      setTarget([...(p.target as [number, number, number])]);
    } else {
      setTarget([0, 0, 0]);
    }
    if (p.up && Array.isArray(p.up)) {
      setUp([...(p.up as [number, number, number])]);
    } else {
      setUp([0, 1, 0]);
    }
  };

  const captureFromViewer = () => {
    if (!cameraSnapshot) return;
    const params = snapshotToCameraParams(cameraSnapshot as CameraData);
    setPosition([...params.position]);
    setTarget([...params.target]);
    if (params.up) setUp([...params.up]);
  };

  const handlePresetSelect = (params: CameraParams) => {
    setPosition([...params.position]);
    setTarget([...params.target]);
    if (params.up) setUp([...params.up]);
  };

  const buildParams = (): Record<string, unknown> => {
    const params: Record<string, unknown> = { position, target };
    if (!isDefaultUp(up)) {
      params.up = up;
    }
    return params;
  };

  const handleApply = (ref: string) => {
    onUpdate({ params: buildParams(), ...(ref ? { ref } : {}) });
  };

  const handleRawApply = (params: Record<string, unknown>, ref: string) => {
    onUpdate({ params, ...(ref ? { ref } : {}) });
  };

  const currentParams: CameraParams = { position, target };
  if (up[0] !== 0 || up[1] !== 1 || up[2] !== 0) {
    currentParams.up = up;
  }
  const previewJson = JSON.stringify(currentParams, null, 2);

  const defaultTrigger = (
    <Button
      variant='outline'
      size='sm'
      className='h-8'
      title='Edit camera settings'
    >
      <CameraIcon className='size-4 mr-1' />
      Edit
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
      trigger={trigger ?? defaultTrigger}
      title='Camera Helper'
      dialogContentClassName='sm:max-w-2xl'
      tabs={[
        {
          id: 'vectors',
          label: 'Vectors',
          content: (
            <div className='flex gap-4'>
              <div className='w-1/3 shrink-0 flex items-start justify-center'>
                <CameraPreview position={position} target={target} />
              </div>
              <div className='w-2/3 min-w-0 space-y-3'>
                <VectorsPanel
                  position={position}
                  target={target}
                  up={up}
                  onPositionChange={setPosition}
                  onTargetChange={setTarget}
                  onUpChange={setUp}
                />
                <div className='border-t pt-3'>
                  <Label className='text-xs text-muted-foreground'>Preview</Label>
                  <pre className='text-xs font-mono bg-muted p-2 rounded-md mt-1 overflow-auto max-h-24'>
                    {previewJson}
                  </pre>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'presets',
          label: 'Presets',
          content: (
            <div className='flex gap-4'>
              <div className='w-1/3 shrink-0 flex items-start justify-center'>
                <CameraPreview position={position} target={target} />
              </div>
              <div className='w-2/3 min-w-0'>
                <PresetsPanel onSelect={handlePresetSelect} />
              </div>
            </div>
          ),
        },
        {
          id: 'capture',
          label: 'Capture',
          content: (
            <div className='space-y-3'>
              <p className='text-sm text-muted-foreground'>
                Capture the current viewer camera position and use it as the camera settings.
              </p>
              <Button
                size='sm'
                variant='outline'
                onClick={captureFromViewer}
                disabled={!cameraSnapshot}
                title={cameraSnapshot ? 'Capture current viewer camera position' : 'No viewer camera available'}
              >
                <CrosshairIcon className='size-4 mr-1' />
                Capture from Viewer
              </Button>
              {!!cameraSnapshot && (
                <div className='border-t pt-3'>
                  <Label className='text-xs text-muted-foreground'>Current capture</Label>
                  <pre className='text-xs font-mono bg-muted p-2 rounded-md mt-1 overflow-auto max-h-24'>
                    {previewJson}
                  </pre>
                </div>
              )}
            </div>
          ),
        },
      ]}
      defaultTab='vectors'
    />
  );
}
