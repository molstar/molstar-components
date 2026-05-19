'use client';
import { useState } from 'react';
import { Input } from '../base/input.tsx';
import { Label } from '../base/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select.tsx';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../base/dialog.tsx';
import { Button } from '../base/button.tsx';
import type { UINode } from '../../state-builder/index.ts';
import { PARSE_FORMATS, getActiveValues } from '../../state-builder/index.ts';

interface CompositeHelperProps {
  downloadNode: UINode;
  parseNode: UINode;
  onApply: (downloadUpdates: Partial<UINode>, parseUpdates: Partial<UINode>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompositeHelper({ downloadNode, parseNode, onApply, open, onOpenChange }: CompositeHelperProps) {
  const [url, setUrl] = useState((downloadNode.params.url as string) ?? '');
  const [format, setFormat] = useState((parseNode.params.format as string) ?? '');
  const formats = getActiveValues(PARSE_FORMATS);

  // Reinit when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setUrl((downloadNode.params.url as string) ?? '');
      setFormat((parseNode.params.format as string) ?? '');
    }
    onOpenChange(isOpen);
  };

  const handleApply = () => {
    onApply(
      { params: { ...downloadNode.params, url } },
      { params: { ...parseNode.params, format } },
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader><DialogTitle className='text-base'>Download / Parse</DialogTitle></DialogHeader>
        <div className='flex flex-col gap-4 py-2'>
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>URL</Label>
            <Input className='text-sm font-mono' placeholder='https://files.rcsb.org/download/1tqn.bcif' value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className='flex flex-col gap-1'>
            <Label className='text-xs'>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger size='sm'><SelectValue placeholder='Select format' /></SelectTrigger>
              <SelectContent>{formats.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' size='sm' onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size='sm' onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
