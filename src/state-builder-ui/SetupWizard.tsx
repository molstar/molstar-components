'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog.tsx';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx';
import { PlusIcon, XIcon } from 'lucide-react';
import type { UINode } from '@molstar/state-builder';
import {
  PARSE_FORMATS,
  REPRESENTATION_TYPES,
  COMPONENT_SELECTORS,
  getActiveValues,
  createEmptyNode,
  assignMissingRefs,
} from '@molstar/state-builder';
import { SelectorHelperContent, type SelectorTab } from './SelectorHelperContent.tsx';

interface SetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (nodes: UINode[]) => void;
}

type WizardStep = 1 | 2 | 3;

const QUICK_COLORS = ['#3050F8', '#e85d04', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

interface ComponentConfig {
  id: string;
  selector: string;
  customSelector: unknown;
  representation: string;
  color: string;
  opacity: number;
  label: string;
  selectorTab: SelectorTab;
  selectorExpanded: boolean;
}

function newComponent(): ComponentConfig {
  return {
    id: Math.random().toString(36).slice(2),
    selector: 'polymer',
    customSelector: undefined,
    representation: 'cartoon',
    color: QUICK_COLORS[0],
    opacity: 1,
    label: '',
    selectorTab: 'chain',
    selectorExpanded: false,
  };
}

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  const steps = [{ n: 1, label: 'Source' }, { n: 2, label: 'Structure' }, { n: 3, label: 'Components' }];
  return (
    <div className='flex items-center px-5 pt-4 gap-0'>
      {steps.map((s, i) => (
        <div key={s.n} className='flex items-center'>
          <div className='flex items-center gap-1.5'>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep > s.n ? 'bg-green-500 text-white' : currentStep === s.n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {currentStep > s.n ? '✓' : s.n}
            </div>
            <span className={`text-xs font-medium ${currentStep === s.n ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`h-px w-8 mx-2 ${currentStep > s.n ? 'bg-green-500' : 'bg-muted'}`} />}
        </div>
      ))}
    </div>
  );
}

export function SetupWizard({ open, onOpenChange, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1 state
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('bcif');

  // Step 2 state
  const [structureType, setStructureType] = useState('model');
  const [assemblyId, setAssemblyId] = useState('');

  // Step 3 state
  const [components, setComponents] = useState<ComponentConfig[]>([newComponent()]);
  const [activeCompTab, setActiveCompTab] = useState('0');

  const formats = getActiveValues(PARSE_FORMATS);
  const reprTypes = getActiveValues(REPRESENTATION_TYPES);
  const presetSelectors = getActiveValues(COMPONENT_SELECTORS);

  const updateComponent = (idx: number, updates: Partial<ComponentConfig>) => {
    setComponents((prev) => prev.map((c, i) => i === idx ? { ...c, ...updates } : c));
  };

  const addComponent = () => {
    const newIdx = components.length;
    setComponents((prev) => [...prev, newComponent()]);
    setActiveCompTab(String(newIdx));
  };

  const removeComponent = (idx: number) => {
    if (components.length <= 1) return;
    setComponents((prev) => prev.filter((_, i) => i !== idx));
    setActiveCompTab(String(Math.max(0, idx - 1)));
  };

  const handleCreate = () => {
    const downloadNode: UINode = { ...createEmptyNode('download'), params: { url } };
    const parseNode: UINode = { ...createEmptyNode('parse'), params: { format } };
    const structureParams: Record<string, unknown> = { type: structureType };
    if (structureType === 'assembly' && assemblyId) structureParams.assembly_id = assemblyId;
    const structureNode: UINode = { ...createEmptyNode('structure'), params: structureParams };

    structureNode.children = components.map((comp) => {
      const selector = comp.selector === 'custom' ? comp.customSelector : comp.selector;
      const componentNode: UINode = { ...createEmptyNode('component'), params: { selector } };
      const reprNode: UINode = { ...createEmptyNode('representation'), params: { type: comp.representation } };
      const colorNode: UINode = { ...createEmptyNode('color'), params: { color: comp.color } };
      const reprChildren: UINode[] = [colorNode];
      if (comp.opacity < 1) {
        reprChildren.push({ ...createEmptyNode('opacity'), params: { opacity: comp.opacity } });
      }
      reprNode.children = reprChildren;
      const componentChildren: UINode[] = [reprNode];
      if (comp.label.trim()) {
        componentChildren.push({ ...createEmptyNode('label'), params: { text: comp.label.trim() } });
      }
      componentNode.children = componentChildren;
      return componentNode;
    });

    parseNode.children = [structureNode];
    downloadNode.children = [parseNode];

    const nodes = assignMissingRefs([downloadNode], []);
    onComplete(nodes);
    onOpenChange(false);
    // Reset wizard
    setStep(1);
    setUrl(''); setFormat('bcif');
    setStructureType('model'); setAssemblyId('');
    setComponents([newComponent()]); setActiveCompTab('0');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px] gap-0 p-0 overflow-hidden'>
        <DialogHeader className='pb-0'>
          <StepIndicator currentStep={step} />
          <DialogTitle className='px-5 pt-3 pb-0 text-base'>
            {step === 1 ? 'Load a structure' : step === 2 ? 'Structure type' : 'Components'}
          </DialogTitle>
          <p className='px-5 pb-3 text-xs text-muted-foreground'>
            {step === 1 ? 'Where should the data come from?' : step === 2 ? 'How to interpret the loaded data' : 'Define what to show and how'}
          </p>
        </DialogHeader>

        {/* Step 1 */}
        {step === 1 && (
          <div className='px-5 py-2 flex flex-col gap-4'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>URL</Label>
              <Input className='text-sm font-mono' placeholder='https://files.rcsb.org/download/1tqn.bcif' value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className='flex flex-col gap-1 w-48'>
              <Label className='text-xs'>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger size='sm'><SelectValue /></SelectTrigger>
                <SelectContent>{formats.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className='px-5 py-2 flex flex-col gap-4'>
            <div className='flex flex-col gap-1 w-56'>
              <Label className='text-xs'>Type</Label>
              <Select value={structureType} onValueChange={setStructureType}>
                <SelectTrigger size='sm'><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='model'>Model</SelectItem>
                  <SelectItem value='assembly'>Assembly</SelectItem>
                  <SelectItem value='symmetry'>Symmetry</SelectItem>
                  <SelectItem value='symmetry_mates'>Symmetry mates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {structureType === 'assembly' && (
              <div className='flex flex-col gap-1 w-32'>
                <Label className='text-xs'>Assembly ID</Label>
                <Input className='h-7 text-sm' placeholder='1' value={assemblyId} onChange={(e) => setAssemblyId(e.target.value)} />
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Tabs value={activeCompTab} onValueChange={setActiveCompTab}>
            <TabsList className='w-full justify-start rounded-none border-b bg-transparent h-auto px-5 pb-0 gap-1 flex-wrap'>
              {components.map((comp, idx) => (
                <TabsTrigger
                  key={comp.id}
                  value={String(idx)}
                  className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2 text-xs flex items-center gap-1'
                >
                  Comp {idx + 1}
                  {components.length > 1 && (
                    <span
                      className='ml-1 text-muted-foreground hover:text-destructive'
                      onClick={(e) => { e.stopPropagation(); removeComponent(idx); }}
                    >
                      <XIcon className='size-3' />
                    </span>
                  )}
                </TabsTrigger>
              ))}
              <button
                type='button'
                onClick={addComponent}
                className='pb-2 text-xs text-primary hover:text-primary/80 flex items-center gap-0.5'
              >
                <PlusIcon className='size-3' />
              </button>
            </TabsList>

            {components.map((comp, idx) => (
              <TabsContent key={comp.id} value={String(idx)} className='px-5 py-3 mt-0 flex flex-col gap-4'>
                {/* Selector */}
                <div className='flex flex-col gap-2'>
                  <Label className='text-xs'>Selector</Label>
                  <div className='flex gap-2 items-center'>
                    <Select
                      value={comp.selector === 'custom' ? 'custom' : comp.selector}
                      onValueChange={(v) => updateComponent(idx, { selector: v, selectorExpanded: v === 'custom' })}
                    >
                      <SelectTrigger size='sm' className='flex-1'><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {presetSelectors.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        <SelectItem value='custom'>Custom…</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {comp.selectorExpanded && (
                    <div className='border border-primary/30 rounded-lg overflow-hidden bg-primary/5'>
                      <div className='flex items-center justify-between px-3 py-1.5 bg-primary/10 text-xs font-semibold text-primary'>
                        Custom selector
                        <button type='button' className='text-xs font-normal' onClick={() => updateComponent(idx, { selectorExpanded: false })}>collapse ↑</button>
                      </div>
                      <div className='p-2'>
                        <SelectorHelperContent
                          value={comp.customSelector as never}
                          onChange={(v) => updateComponent(idx, { customSelector: v })}
                          activeTab={comp.selectorTab}
                          onTabChange={(t) => updateComponent(idx, { selectorTab: t })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Representation + Color */}
                <div className='flex gap-4'>
                  <div className='flex flex-col gap-1 flex-1'>
                    <Label className='text-xs'>Representation</Label>
                    <Select value={comp.representation} onValueChange={(v) => updateComponent(idx, { representation: v })}>
                      <SelectTrigger size='sm'><SelectValue /></SelectTrigger>
                      <SelectContent>{reprTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className='flex flex-col gap-1'>
                    <Label className='text-xs'>Color</Label>
                    <div className='flex gap-1.5 items-center flex-wrap'>
                      {QUICK_COLORS.map((c) => (
                        <button
                          key={c}
                          type='button'
                          onClick={() => updateComponent(idx, { color: c })}
                          className={`w-5 h-5 rounded cursor-pointer transition-transform ${comp.color === c ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-105'}`}
                          style={{ background: c }}
                        />
                      ))}
                      <label
                        className='w-5 h-5 rounded cursor-pointer border-2 border-dashed border-muted-foreground/40 flex items-center justify-center hover:border-primary transition-colors shrink-0'
                        title='Custom color…'
                      >
                        <PlusIcon className='size-2.5 text-muted-foreground' />
                        <input
                          type='color'
                          value={comp.color}
                          onChange={(e) => updateComponent(idx, { color: e.target.value })}
                          className='sr-only'
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Opacity */}
                <div className='flex flex-col gap-1'>
                  <Label className='text-xs'>Opacity</Label>
                  <div className='flex items-center gap-3'>
                    <input type='range' min='0' max='1' step='0.01' value={comp.opacity} onChange={(e) => updateComponent(idx, { opacity: parseFloat(e.target.value) })} className='flex-1 accent-primary' />
                    <span className='text-xs text-muted-foreground w-8 text-right'>{comp.opacity.toFixed(2)}</span>
                  </div>
                </div>

                {/* Label (optional) */}
                <div className='flex flex-col gap-1'>
                  <Label className='text-xs'>Label <span className='text-muted-foreground font-normal'>(optional)</span></Label>
                  <Input className='h-7 text-sm' placeholder='e.g. Active site' value={comp.label} onChange={(e) => updateComponent(idx, { label: e.target.value })} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <DialogFooter className='px-5 py-3 border-t'>
          {step > 1 && (
            <Button variant='outline' size='sm' onClick={() => setStep((s) => (s - 1) as WizardStep)}>
              ← Back
            </Button>
          )}
          <div className='ml-auto flex gap-2'>
            {step < 3 ? (
              <Button size='sm' onClick={() => setStep((s) => (s + 1) as WizardStep)} disabled={step === 1 && !url.trim()}>
                Next →
              </Button>
            ) : (
              <Button size='sm' onClick={handleCreate}>
                Create tree ✓
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
