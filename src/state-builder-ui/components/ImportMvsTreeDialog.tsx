'use client';

import { useState } from 'react';
import { Button } from '../base/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../base/dialog.tsx';
import { Textarea } from '../base/textarea.tsx';
import { UploadIcon } from 'lucide-react';
import { useNotify } from '../state/notifications.ts';
import {
  mvsTreeToUINodes,
  extractCameraFromUINodes,
  extractAnimationFromUINodes,
  assignMissingRefs,
} from '../../state-builder/index.ts';
import type { UINode, CameraParams, AnimationParams, RawMVSTree } from '../../state-builder/index.ts';

interface ImportMvsTreeDialogProps {
  onImport: (nodes: UINode[], camera: CameraParams | null, animation: AnimationParams | null) => void;
}

export function ImportMvsTreeDialog({ onImport }: ImportMvsTreeDialogProps) {
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [importJson, setImportJson] = useState('');

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);

      // Check if it's a valid MVSTree (has kind: 'root')
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON: expected an object');
      }

      if (parsed.kind !== 'root') {
        throw new Error('Invalid MVSTree: root node must have kind "root"');
      }

      const mvsTree = parsed as RawMVSTree;
      const uiNodes = mvsTreeToUINodes(mvsTree);

      if (uiNodes.length === 0) {
        throw new Error('MVSTree has no children nodes');
      }

      // Extract camera nodes into the dedicated camera section
      const cameraExtracted = extractCameraFromUINodes(uiNodes);

      // Extract animation nodes into the dedicated animation section
      const animExtracted = extractAnimationFromUINodes(cameraExtracted.nodes);

      const nodesWithRefs = assignMissingRefs(animExtracted.nodes, []);

      onImport(nodesWithRefs, cameraExtracted.camera, animExtracted.animation);
      setOpen(false);
      setImportJson('');
      notify({ type: 'success', message: 'MVSTree imported successfully!' });
    } catch (error) {
      notify({ type: 'error', message: `Import failed: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          <UploadIcon className='size-4 mr-1' />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Import MVSTree JSON</DialogTitle>
          <DialogDescription>
            Paste an MVSTree JSON object with kind &quot;root&quot; to load it into the visual builder.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          className='min-h-[300px] font-mono text-xs'
          placeholder='{"kind": "root", "children": [...]}'
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
        />
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!importJson.trim()}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
