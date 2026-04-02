'use client';

import { Button } from './ui/button.tsx';
import { CameraIcon, ChevronDownIcon, ChevronRightIcon, CrosshairIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { CameraSnapshotAtom } from './state/atoms.ts';
import type { CameraData } from '@molstar/state-builder';
import { snapshotToCameraParams, isDefaultUp } from '@molstar/state-builder';
import { CameraHelper } from './CameraHelper.tsx';
import type { CameraParams } from './camera-helper/index.ts';

interface CameraSectionProps {
  camera: CameraParams | null;
  onCameraChange: (camera: CameraParams | null) => void;
}

function formatVec3(v: [number, number, number]): string {
  return `[${v.map((n) => n.toFixed(1)).join(', ')}]`;
}

export function CameraSection({ camera, onCameraChange }: CameraSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const cameraSnapshot = useAtomValue(CameraSnapshotAtom);

  const captureFromViewer = () => {
    if (!cameraSnapshot) return;
    onCameraChange(snapshotToCameraParams(cameraSnapshot as CameraData));
  };

  return (
    <div className='border rounded-md'>
      {/* Header */}
      <div
        className='flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50'
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDownIcon className='size-4' />
        ) : (
          <ChevronRightIcon className='size-4' />
        )}
        <CameraIcon className='size-4' />
        <span className='text-sm font-medium'>Camera</span>
        <span className='text-xs text-muted-foreground'>
          {camera ? 'set' : 'not set'}
        </span>
      </div>

      {/* Content */}
      {expanded && (
        <div className='p-2 pt-0 space-y-2'>
          {camera ? (
            <>
              {/* Compact summary */}
              <div className='text-xs font-mono bg-muted/50 rounded-md p-2 space-y-0.5'>
                <div>
                  <span className='text-muted-foreground'>Position: </span>
                  {formatVec3(camera.position)}
                </div>
                <div>
                  <span className='text-muted-foreground'>Target: </span>
                  {formatVec3(camera.target)}
                </div>
                {camera.up && !isDefaultUp(camera.up) && (
                  <div>
                    <span className='text-muted-foreground'>Up: </span>
                    {formatVec3(camera.up)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className='flex gap-2'>
                <CameraHelper onApply={onCameraChange} initialValue={camera} />
                <Button
                  size='sm'
                  variant='outline'
                  className='h-8'
                  onClick={(e) => {
                    e.stopPropagation();
                    captureFromViewer();
                  }}
                  disabled={!cameraSnapshot}
                  title={cameraSnapshot ? 'Capture current viewer camera' : 'No viewer camera available'}
                >
                  <CrosshairIcon className='size-4 mr-1' />
                  Capture
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  className='h-8'
                  onClick={(e) => {
                    e.stopPropagation();
                    onCameraChange(null);
                  }}
                  title='Remove camera'
                >
                  <XIcon className='size-4 mr-1' />
                  Clear
                </Button>
              </div>
            </>
          ) : (
            <div className='flex flex-col items-center gap-2 py-2'>
              <p className='text-sm text-muted-foreground'>No camera set.</p>
              <div className='flex gap-2'>
                <CameraHelper
                  onApply={onCameraChange}
                  initialValue={null}
                />
                <Button
                  size='sm'
                  variant='outline'
                  className='h-8'
                  onClick={(e) => {
                    e.stopPropagation();
                    captureFromViewer();
                  }}
                  disabled={!cameraSnapshot}
                  title={cameraSnapshot ? 'Capture current viewer camera' : 'No viewer camera available'}
                >
                  <CrosshairIcon className='size-4 mr-1' />
                  Capture from Viewer
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
