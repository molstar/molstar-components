'use client';

import type React from 'react';
import { SceneKeyAtom, PluginAtom } from './state/atoms.ts';
import { useAtomValue } from 'jotai';
import { useNotify } from './state/notifications.ts';
import { useCodeGenCallback } from './state/codegen-context.ts';
import { useStateChangeCallback } from './state/state-change-context.ts';
import { useStoryConstants } from './state/story-constants-context.ts';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Button } from './base/button.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './base/dropdown-menu.tsx';
import { PlusIcon, ChevronDownIcon, Undo2Icon, Redo2Icon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { OperationRow } from './rows/OperationRow.tsx';
import { AnimationSection } from './sections/AnimationSection.tsx';
import { CameraSection } from './sections/CameraSection.tsx';
import { ConstantsSection } from './sections/ConstantsSection.tsx';
import {
  createEmptyConstant,
  getValidChildren,
  getTemplatesForParentKind,
  instantiateTemplate,
  extractRefsFromNodes,
  assignMissingRefs,
} from '../state-builder/index.ts';
import { StructureMetadataProvider } from './state/StructureMetadataContext.tsx';
import { SetupWizard } from './SetupWizard.tsx';
import { AfterApplyContext } from './state/after-apply-context.ts';
import { ImportMvsTreeDialog } from './components/ImportMvsTreeDialog.tsx';
import { useCodeGeneration } from './hooks/ui-builder/useCodeGeneration.ts';
import { useUndoableSceneState } from './hooks/ui-builder/useUndoableSceneState.ts';
import { useNodeTreeOperations } from './hooks/ui-builder/useNodeTreeOperations.ts';

/**
 * Visual MVS node-tree builder UI.
 *
 * Must be rendered inside a `UIBuilderProvider`. Renders the full builder
 * interface — structure tree, constants panel, camera section, and animation
 * timeline — connected to the Jotai atoms provided by the parent context.
 *
 * For standalone use, prefer `MolViewStateBuilder` which bundles
 * `UIBuilderProvider` and `UIBuilder` together with a fixed container size.
 */
export function UIBuilder(): React.ReactElement {
  const sceneKey = useAtomValue(SceneKeyAtom);
  const plugin = useAtomValue(PluginAtom) as PluginUIContext | null;
  const onCodeGenerated = useCodeGenCallback();
  const notify = useNotify();

  const scene = useUndoableSceneState(sceneKey);
  const { storyConstants, onStoryConstantsChange } = useStoryConstants();
  const codegen = useCodeGeneration({
    nodes: scene.nodes,
    constants: scene.constants,
    camera: scene.camera,
    animation: scene.animation,
    storyConstants,
    onCodeGenerated,
    notify,
  });
  const nodeOps = useNodeTreeOperations(scene.nodes, scene.updateNodes);

  const [storyConstantsExpanded, setStoryConstantsExpanded] = useState(false);

  // Merged constants for OperationRow dropdowns (story constants first)
  const allAvailableConstants = useMemo(() => [...storyConstants, ...scene.constants], [storyConstants, scene.constants]);

  // Debounced save: persist current scene state to the caller
  const onStateChange = useStateChangeCallback();
  useEffect(() => {
    if (!onStateChange) return;
    const timer = setTimeout(() => {
      onStateChange({ nodes: scene.nodes, constants: scene.constants, camera: scene.camera, animation: scene.animation });
    }, 1000);
    return () => clearTimeout(timer);
  }, [scene.nodes, scene.constants, scene.camera, scene.animation, onStateChange]);

  // Available refs from the node tree (for animation target_ref dropdowns)
  const availableRefs = useMemo(() => extractRefsFromNodes(scene.nodes), [scene.nodes]);

  const [constantsExpanded, setConstantsExpanded] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const addConstant = () => {
    const newConstant = createEmptyConstant('colors');
    scene.updateConstants([...scene.constants, newConstant]);
    if (!constantsExpanded) setConstantsExpanded(true);
  };

  const addStoryConstant = () => {
    if (!onStoryConstantsChange) return;
    const newConstant = createEmptyConstant('colors');
    onStoryConstantsChange([...storyConstants, newConstant]);
    if (!storyConstantsExpanded) setStoryConstantsExpanded(true);
  };

  // Undo/redo: applySnapshot is state-only (see useUndoableSceneState) — regenerate
  // code with the restored snapshot's own data right after, matching the original
  // combined applySnapshot-then-generate behavior exactly.
  const handleUndo = () => {
    const prev = scene.undo();
    if (prev) {
      scene.applySnapshot(prev);
      codegen.generateCodeFromNodes(prev.nodes, [...storyConstants, ...prev.constants], prev.camera, prev.animation);
    }
  };

  const handleRedo = () => {
    const next = scene.redo();
    if (next) {
      scene.applySnapshot(next);
      codegen.generateCodeFromNodes(next.nodes, [...storyConstants, ...next.constants], next.camera, next.animation);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        codegen.generateCode();
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  // Empty deps, matching the original component exactly: handleUndo/handleRedo read
  // fresh state via scene's internal stateRef so they stay correct despite this
  // closure being captured once at mount, but codegen.generateCode() (Ctrl+S) does
  // not have that protection — see this plan's Global Constraints for the resulting
  // pre-existing behavior this deliberately preserves rather than fixes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AfterApplyContext.Provider value={codegen.markPendingCodeGen}>
    <StructureMetadataProvider plugin={plugin ?? null} onGenerateCode={codegen.generateCode}>
      <div data-ui-builder='' className='flex flex-col gap-2 h-full p-2'>
        <div className='flex items-center justify-between pb-2 border-b'>
          <h3 className='text-sm font-medium'>Visual Builder</h3>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={handleUndo}
            disabled={!scene.canUndo}
            title='Undo (Ctrl+Z)'
          >
            <Undo2Icon className='size-4' />
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={handleRedo}
            disabled={!scene.canRedo}
            title='Redo (Ctrl+Y)'
          >
            <Redo2Icon className='size-4' />
          </Button>
          <ImportMvsTreeDialog
            onImport={(newNodes, extractedCamera, extractedAnimation) => {
              scene.applyImportedState({ nodes: newNodes, camera: extractedCamera, animation: extractedAnimation });
              setTimeout(() => {
                codegen.generateCodeFromNodes(
                  newNodes,
                  [...storyConstants, ...scene.constants],
                  extractedCamera ?? scene.camera,
                  extractedAnimation ?? scene.animation,
                );
              }, 0);
            }}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline'>
                <PlusIcon className='size-4 mr-1' />
                Add
                <ChevronDownIcon className='size-4 ml-1' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={nodeOps.addNode}>
                Download / Parse
              </DropdownMenuItem>
              <DropdownMenuItem onClick={nodeOps.addCanvas}>
                Canvas Configuration
              </DropdownMenuItem>
              <DropdownMenuItem onClick={addConstant}>
                Scene Constant
              </DropdownMenuItem>
              {onStoryConstantsChange && (
                <DropdownMenuItem onClick={addStoryConstant}>
                  Story Constant
                </DropdownMenuItem>
              )}
              {getTemplatesForParentKind('root').length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {getTemplatesForParentKind('root').map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => {
                        const templateNodes = assignMissingRefs(instantiateTemplate(template), scene.nodes);
                        scene.updateNodes([...scene.nodes, ...templateNodes]);
                      }}
                      title={template.description}
                    >
                      {template.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={codegen.generateCode} size='sm'>
            Generate Code
          </Button>
        </div>
      </div>

      <div className='flex-1 min-h-0 overflow-y-auto space-y-2 pb-20'>
        {/* Story-wide constants — always visible if any exist or editing is enabled */}
        {(storyConstants.length > 0 || onStoryConstantsChange) && (
          <ConstantsSection
            label='Story Constants'
            constants={storyConstants}
            expanded={storyConstantsExpanded}
            onToggleExpanded={() => setStoryConstantsExpanded((v) => !v)}
            onConstantsChange={onStoryConstantsChange ?? (() => {})}
            readOnly={!onStoryConstantsChange}
          />
        )}

        {/* Scene Constants */}
        <ConstantsSection
          label='Scene Constants'
          constants={scene.constants}
          expanded={constantsExpanded}
          onToggleExpanded={() => setConstantsExpanded(!constantsExpanded)}
          onConstantsChange={scene.updateConstants}
        />

        {/* Camera Section */}
        <CameraSection camera={scene.camera} onCameraChange={scene.updateCamera} />



        {/* Nodes Section */}
        {scene.nodes.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2 border rounded-md'>
            <p>No nodes yet.</p>
            <div className='flex gap-2'>
            <Button size='sm' variant='outline' onClick={() => setWizardOpen(true)}>
              Setup wizard
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size='sm' variant='outline'>
                  <PlusIcon className='size-4 mr-1' />
                  Add
                  <ChevronDownIcon className='size-4 ml-1' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='center'>
                <DropdownMenuItem onClick={nodeOps.addNode}>
                  Download / Parse
                </DropdownMenuItem>
                {getTemplatesForParentKind('root').length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {getTemplatesForParentKind('root').map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => {
                          const templateNodes = instantiateTemplate(template);
                          scene.updateNodes([...scene.nodes, ...templateNodes]);
                        }}
                        title={template.description}
                      >
                        {template.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        ) : (
          scene.nodes.map((node, index) => (
            <OperationRow
              key={node.id}
              node={node}
              isFirst={index === 0}
              isLast={index === scene.nodes.length - 1}
              onUpdate={(updates) => nodeOps.updateNode(node.id, updates)}
              onRemove={() => nodeOps.removeNode(node.id)}
              onAddChild={() => nodeOps.addChildToNode(node.id)}
              onAddTemplateChildren={(templateNodes) => {
                const withRefs = assignMissingRefs(templateNodes, scene.nodes);
                scene.updateNodes(
                  scene.nodes.map((n) =>
                    n.id === node.id
                      ? { ...n, children: [...(n.children || []), ...withRefs] }
                      : n
                  )
                );
              }}
              onCopy={() => nodeOps.copyNode(node.id)}
              onMoveUp={() => nodeOps.moveNodeUp(node.id)}
              onMoveDown={() => nodeOps.moveNodeDown(node.id)}
              availableConstants={allAvailableConstants}
              allowedKinds={getValidChildren('root')}
              allNodes={scene.nodes}
            />
          ))
        )}

        {/* Animation Section */}
        <AnimationSection animation={scene.animation} onAnimationChange={scene.updateAnimation} availableRefs={availableRefs} />
      </div>
      <SetupWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={(newNodes) => {
          const withRefs = assignMissingRefs(newNodes, scene.nodes);
          scene.updateNodes(withRefs);
          setTimeout(() => {
            codegen.generateCodeFromNodes(withRefs);
          }, 0);
        }}
      />
    </div>
    </StructureMetadataProvider>
    </AfterApplyContext.Provider>
  );
}
