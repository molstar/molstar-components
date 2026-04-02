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
import { CameraIcon, CrosshairIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
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

interface CameraHelperProps {
  onApply: (params: CameraParams) => void;
  initialValue?: CameraParams | null;
}

type CameraTab = 'vectors' | 'presets' | 'raw';

export function CameraHelper({ onApply, initialValue }: CameraHelperProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CameraTab>('vectors');
  const cameraSnapshot = useAtomValue(CameraSnapshotAtom);

  // Vector state
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 100]);
  const [target, setTarget] = useState<[number, number, number]>([0, 0, 0]);
  const [up, setUp] = useState<[number, number, number]>([0, 1, 0]);

  // Raw state
  const [rawInput, setRawInput] = useState('');
  const [rawError, setRawError] = useState('');

  // Parse initial value on open
  useEffect(() => {
    if (!open) return;
    if (initialValue) {
      setPosition([...initialValue.position]);
      setTarget([...initialValue.target]);
      setUp(initialValue.up ? [...initialValue.up] : [0, 1, 0]);
    } else {
      setPosition([0, 0, 100]);
      setTarget([0, 0, 0]);
      setUp([0, 1, 0]);
    }
    setRawInput('');
    setRawError('');
  }, [open, initialValue]);

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

  const handleApply = () => {
    if (activeTab === 'raw') {
      const trimmed = rawInput.trim();
      if (!trimmed) {
        setRawError('Empty input');
        return;
      }
      try {
        const parsed = JSON.parse(trimmed);
        if (!parsed.position || !parsed.target) {
          setRawError('Must include "position" and "target" arrays');
          return;
        }
        onApply(parsed as CameraParams);
        setOpen(false);
      } catch {
        setRawError('Invalid JSON');
        return;
      }
    } else {
      const params: CameraParams = { position, target };
      // Only include up if it's not the default [0, 1, 0]
      if (!isDefaultUp(up)) {
        params.up = up;
      }
      onApply(params);
      setOpen(false);
    }
  };

  const currentParams: CameraParams = { position, target };
  if (up[0] !== 0 || up[1] !== 1 || up[2] !== 0) {
    currentParams.up = up;
  }
  const previewJson = JSON.stringify(currentParams, null, 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8'
          title='Edit camera settings'
        >
          <CameraIcon className='size-4 mr-1' />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-3xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle>Camera Helper</DialogTitle>
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
          </div>
        </DialogHeader>

        <div className='flex gap-4'>
          {/* SVG Preview - 1/3 */}
          <div className='w-1/3 shrink-0 flex items-start justify-center'>
            <CameraPreview position={position} target={target} />
          </div>

          {/* Tabs - 2/3 */}
          <div className='w-2/3 min-w-0'>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CameraTab)}>
              <TabsList>
                <TabsTrigger value='vectors'>Vectors</TabsTrigger>
                <TabsTrigger value='presets'>Presets</TabsTrigger>
                <TabsTrigger value='raw'>Raw</TabsTrigger>
              </TabsList>

              <TabsContent value='vectors'>
                <VectorsPanel
                  position={position}
                  target={target}
                  up={up}
                  onPositionChange={setPosition}
                  onTargetChange={setTarget}
                  onUpChange={setUp}
                />
              </TabsContent>

              <TabsContent value='presets'>
                <PresetsPanel onSelect={handlePresetSelect} />
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
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Camera
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
