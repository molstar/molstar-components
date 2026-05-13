'use client';

import type React from 'react';
import { SceneKeyAtom, UIBuilderAnimationAtom, UIBuilderCameraAtom, UIBuilderConstantsAtom, UIBuilderNodesAtom, PluginAtom } from './state/atoms.ts';
import { useNotify } from './state/notifications.ts';
import { useCodeGenCallback } from './state/codegen-context.ts';
import { useStateChangeCallback } from './state/state-change-context.ts';
import { useStoryConstants } from './state/story-constants-context.ts';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Button } from './base/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './base/dialog.tsx';
import { Textarea } from './base/textarea.tsx';
import { ASTFactory } from '../state-builder/compiler/ast/factory.ts';
import { CodeGenerator } from '../state-builder/compiler/codegen/generator.ts';
import { useAtom, useAtomValue } from 'jotai';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './base/dropdown-menu.tsx';
import { UploadIcon, PlusIcon, ChevronDownIcon, Undo2Icon, Redo2Icon } from 'lucide-react';
import { useUndoRedo } from './state/undo-redo.ts';
import type { UndoSnapshot } from './state/undo-redo.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAutoGenerateOnMount } from './state/auto-generate-context.ts';
import { OperationRow } from './OperationRow.tsx';
import { AnimationSection } from './AnimationSection.tsx';
import { CameraSection } from './CameraSection.tsx';
import { ConstantsSection } from './ConstantsSection.tsx';
import {
  createEmptyNode,
  createEmptyConstant,
  deepCopyNode,
  UINode,
  ConstantDefinition,
  getValidChildren,
  getTemplatesForParentKind,
  instantiateTemplate,
  mvsTreeToUINodes,
  uiNodeToMVSNode,
  extractCameraFromUINodes,
  extractAnimationFromUINodes,
  extractRefsFromNodes,
  convertAnimationToMVSNode,
  isDefaultUp,
  assignMissingRefs,
  type RawMVSTree,
  type CameraParams,
  type AnimationParams,
} from '../state-builder/index.ts';
import { createDownloadParseNodes } from '../state-builder/types/composite-sequences.ts';
import { StructureMetadataProvider } from './StructureMetadataContext.tsx';
import { SetupWizard } from './SetupWizard.tsx';
import { AfterApplyContext } from './state/after-apply-context.ts';

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

  // Nodes state (per-scene)
  const [allNodes, setAllNodes] = useAtom(UIBuilderNodesAtom);
  const nodes = (allNodes[sceneKey] || []) as UINode[];
  const setNodes = (newNodes: UINode[]) => {
    setAllNodes({ ...allNodes, [sceneKey]: newNodes });
  };

  // Constants state (per-scene)
  const [allConstants, setAllConstants] = useAtom(UIBuilderConstantsAtom);
  const constants = (allConstants[sceneKey] || []) as ConstantDefinition[];
  const setConstants = (newConstants: ConstantDefinition[]) => {
    setAllConstants({ ...allConstants, [sceneKey]: newConstants });
  };

  // Camera state (per-scene)
  const [allCameras, setAllCameras] = useAtom(UIBuilderCameraAtom);
  const camera = allCameras[sceneKey] || null;
  const setCamera = (newCamera: CameraParams | null) => {
    setAllCameras({ ...allCameras, [sceneKey]: newCamera });
  };

  // Animation state (per-scene)
  const [allAnimations, setAllAnimations] = useAtom(UIBuilderAnimationAtom);
  const animation = (allAnimations[sceneKey] || null) as AnimationParams | null;
  const setAnimation = (newAnimation: AnimationParams | null) => {
    setAllAnimations({ ...allAnimations, [sceneKey]: newAnimation });
  };

  const { push, undo, redo, canUndo, canRedo } = useUndoRedo();

  // Always-current ref for use in keyboard handler
  const stateRef = useRef<UndoSnapshot>({ nodes, constants, camera, animation });
  useEffect(() => {
    stateRef.current = { nodes, constants, camera, animation };
  }, [nodes, constants, camera, animation]);

  // After-apply auto-codegen: set this flag from NodeHelperBase Apply; the effect below
  // fires once React has committed the new nodes so generateCodeFromNodes sees fresh state.
  const pendingCodeGenRef = useRef(false);
  useEffect(() => {
    if (pendingCodeGenRef.current && nodes.length > 0) {
      pendingCodeGenRef.current = false;
      generateCodeFromNodes(nodes);
    }
  // generateCodeFromNodes is redefined each render (closes over constants/camera/animation),
  // so intentionally omitted — we only want this to fire when nodes changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  // History-aware setters — push snapshot before applying change
  const updateNodes = (newNodes: UINode[]) => {
    push({ nodes, constants, camera, animation });
    setNodes(newNodes);
  };
  const updateConstants = (newConstants: ConstantDefinition[]) => {
    push({ nodes, constants, camera, animation });
    setConstants(newConstants);
  };
  const updateCamera = (newCamera: CameraParams | null) => {
    push({ nodes, constants, camera, animation });
    setCamera(newCamera);
  };
  const updateAnimation = (newAnimation: AnimationParams | null) => {
    push({ nodes, constants, camera, animation });
    setAnimation(newAnimation);
  };

  // Story-wide constants (from context)
  const { storyConstants, onStoryConstantsChange } = useStoryConstants();
  const [storyConstantsExpanded, setStoryConstantsExpanded] = useState(false);

  // Merged constants for OperationRow dropdowns (story constants first)
  const allAvailableConstants = useMemo(() => [...storyConstants, ...constants], [storyConstants, constants]);

  // Debounced save: persist current scene state to the caller
  const onStateChange = useStateChangeCallback();
  useEffect(() => {
    if (!onStateChange) return;
    const timer = setTimeout(() => {
      onStateChange({ nodes, constants, camera, animation });
    }, 1000);
    return () => clearTimeout(timer);
  }, [nodes, constants, camera, animation, onStateChange]);

  // Available refs from the node tree (for animation target_ref dropdowns)
  const availableRefs = useMemo(() => extractRefsFromNodes(nodes), [nodes]);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [constantsExpanded, setConstantsExpanded] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const addNode = () => {
    const [newNode] = assignMissingRefs([createDownloadParseNodes()], nodes);
    updateNodes([...nodes, newNode]);
  };

  const addConstant = () => {
    const newConstant = createEmptyConstant('colors');
    updateConstants([...constants, newConstant]);
    if (!constantsExpanded) setConstantsExpanded(true);
  };

  const addStoryConstant = () => {
    if (!onStoryConstantsChange) return;
    const newConstant = createEmptyConstant('colors');
    onStoryConstantsChange([...storyConstants, newConstant]);
    if (!storyConstantsExpanded) setStoryConstantsExpanded(true);
  };

  const updateNode = (id: string, updates: Partial<UINode>) => {
    updateNodes(nodes.map((node) => (node.id === id ? { ...node, ...updates } : node)));
  };

  const removeNode = (id: string) => {
    updateNodes(nodes.filter((node) => node.id !== id));
  };

  const addChildToNode = (id: string) => {
    updateNodes(
      nodes.map((node) => {
        if (node.id === id) {
          const newChild = createEmptyNode();
          return {
            ...node,
            children: [...(node.children || []), newChild],
          };
        }
        return node;
      })
    );
  };

  const copyNode = (id: string) => {
    const nodeToCopy = nodes.find((node) => node.id === id);
    if (!nodeToCopy) return;

    const copiedNode = deepCopyNode(nodeToCopy);

    updateNodes([...nodes, copiedNode]);
  };

  const moveNodeUp = (id: string) => {
    const index = nodes.findIndex((node) => node.id === id);
    if (index <= 0) return;

    const newNodes = [...nodes];
    [newNodes[index - 1], newNodes[index]] = [newNodes[index], newNodes[index - 1]];
    updateNodes(newNodes);
  };

  const moveNodeDown = (id: string) => {
    const index = nodes.findIndex((node) => node.id === id);
    if (index === -1 || index >= nodes.length - 1) return;

    const newNodes = [...nodes];
    [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
    updateNodes(newNodes);
  };

  const generateCodeFromNodes = (nodesToGenerate: UINode[], constantsToInclude: ConstantDefinition[] = [...storyConstants, ...constants], cameraToInclude: CameraParams | null = camera, animationToInclude: AnimationParams | null = animation) => {
    try {
      if (nodesToGenerate.length === 0) {
        notify({ type: 'error', message: 'No nodes to generate code from. Add nodes or import an MVSTree first.' });
        return;
      }

      // Build children list, appending camera node if set
      const children = nodesToGenerate.map(uiNodeToMVSNode);
      if (cameraToInclude) {
        const cameraParams: Record<string, unknown> = {
          position: cameraToInclude.position,
          target: cameraToInclude.target,
        };
        if (cameraToInclude.up && !isDefaultUp(cameraToInclude.up)) {
          cameraParams.up = cameraToInclude.up;
        }
        children.push({ kind: 'camera', params: cameraParams });
      }

      // Append animation node if set
      if (animationToInclude && (animationToInclude.steps.length > 0 || animationToInclude.trackball?.enabled)) {
        children.push(convertAnimationToMVSNode(animationToInclude));
      }

      // Build MVS data structure with root wrapper
      const mvsData = {
        root: {
          kind: 'root' as const,
          params: {},
          children,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      console.log('MVS Data:', JSON.stringify(mvsData, null, 2));

      // Pass directly to compiler
      const ast = ASTFactory.fromMVSData(mvsData);

      // Filter out incomplete constants (no name or no entries)
      const validConstants = constantsToInclude.filter(
        (c) => c.name && c.entries.length > 0 && c.entries.some((e) => e.key)
      );

      const generator = new CodeGenerator({
        includeSectionMarkers: true,
        builderVar: 'builder',
        includeComments: true,
        constants: validConstants,
      });

      const code = generator.generate(ast);

      console.log('Generated code:', code);

      // Call the callback if provided
      if (onCodeGenerated) {
        onCodeGenerated(code);
        notify({ type: 'success', message: 'Code generated and applied to editor!' });
      } else {
        notify({ type: 'success', message: 'Code generated successfully! (no callback provided)' });
      }
    } catch (error) {
      console.error('Code generation error:', error);
      notify({ type: 'error', message: `Failed to generate code: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const generateCode = () => {
    generateCodeFromNodes(nodes);
  };

  // Auto-generate code on mount when initialState was provided
  const autoGenerateOnMount = useAutoGenerateOnMount();
  const hasAutoGenerated = useRef(false);
  useEffect(() => {
    if (!autoGenerateOnMount || hasAutoGenerated.current || nodes.length === 0) return;
    hasAutoGenerated.current = true;
    generateCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]); // re-check each render until nodes are populated, then fire once

  const applySnapshot = (snap: UndoSnapshot) => {
    setNodes(snap.nodes);
    setConstants(snap.constants);
    setCamera(snap.camera);
    setAnimation(snap.animation);
    generateCodeFromNodes(snap.nodes, [...storyConstants, ...snap.constants], snap.camera, snap.animation);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        const prev = undo(stateRef.current);
        if (prev) applySnapshot(prev);
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        const next = redo(stateRef.current);
        if (next) applySnapshot(next);
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        generateCode();
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, []); // stateRef always current; undo/redo/generateCode are stable

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
      push({ nodes, constants, camera, animation });
      if (cameraExtracted.camera) {
        setCamera(cameraExtracted.camera);
      }
      if (animExtracted.animation) {
        setAnimation(animExtracted.animation);
      }
      setNodes(nodesWithRefs);
      setImportDialogOpen(false);
      setImportJson('');
      notify({ type: 'success', message: 'MVSTree imported successfully!' });

      // Auto-generate code after import
      setTimeout(() => {
        generateCodeFromNodes(nodesWithRefs, [...storyConstants, ...constants], cameraExtracted.camera ?? camera, animExtracted.animation ?? animation);
      }, 0);
    } catch (error) {
      notify({ type: 'error', message: `Import failed: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  return (
    <AfterApplyContext.Provider value={() => { pendingCodeGenRef.current = true; }}>
    <StructureMetadataProvider plugin={plugin ?? null} onGenerateCode={generateCode}>
      <div data-ui-builder='' className='flex flex-col gap-2 h-full p-2'>
        <div className='flex items-center justify-between pb-2 border-b'>
          <h3 className='text-sm font-medium'>Visual Builder</h3>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              const prev = undo(stateRef.current);
              if (prev) applySnapshot(prev);
            }}
            disabled={!canUndo}
            title='Undo (Ctrl+Z)'
          >
            <Undo2Icon className='size-4' />
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              const next = redo(stateRef.current);
              if (next) applySnapshot(next);
            }}
            disabled={!canRedo}
            title='Redo (Ctrl+Y)'
          >
            <Redo2Icon className='size-4' />
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
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
                <Button variant='outline' onClick={() => setImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={!importJson.trim()}>
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline'>
                <PlusIcon className='size-4 mr-1' />
                Add
                <ChevronDownIcon className='size-4 ml-1' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={addNode}>
                Empty Node
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
                        const templateNodes = assignMissingRefs(instantiateTemplate(template), nodes);
                        updateNodes([...nodes, ...templateNodes]);
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
          <Button onClick={generateCode} size='sm'>
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
          constants={constants}
          expanded={constantsExpanded}
          onToggleExpanded={() => setConstantsExpanded(!constantsExpanded)}
          onConstantsChange={updateConstants}
        />

        {/* Camera Section */}
        <CameraSection camera={camera} onCameraChange={updateCamera} />



        {/* Nodes Section */}
        {nodes.length === 0 ? (
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
                <DropdownMenuItem onClick={addNode}>
                  Empty Node
                </DropdownMenuItem>
                {getTemplatesForParentKind('root').length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {getTemplatesForParentKind('root').map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => {
                          const templateNodes = instantiateTemplate(template);
                          updateNodes([...nodes, ...templateNodes]);
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
          nodes.map((node, index) => (
            <OperationRow
              key={node.id}
              node={node}
              isFirst={index === 0}
              isLast={index === nodes.length - 1}
              onUpdate={(updates) => updateNode(node.id, updates)}
              onRemove={() => removeNode(node.id)}
              onAddChild={() => addChildToNode(node.id)}
              onAddTemplateChildren={(templateNodes) => {
                const withRefs = assignMissingRefs(templateNodes, nodes);
                updateNodes(
                  nodes.map((n) =>
                    n.id === node.id
                      ? { ...n, children: [...(n.children || []), ...withRefs] }
                      : n
                  )
                );
              }}
              onCopy={() => copyNode(node.id)}
              onMoveUp={() => moveNodeUp(node.id)}
              onMoveDown={() => moveNodeDown(node.id)}
              availableConstants={allAvailableConstants}
              allowedKinds={getValidChildren('root')}
              allNodes={nodes}
            />
          ))
        )}

        {/* Animation Section */}
        <AnimationSection animation={animation} onAnimationChange={updateAnimation} availableRefs={availableRefs} />
      </div>
      <SetupWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={(newNodes) => {
          const withRefs = assignMissingRefs(newNodes, nodes);
          updateNodes(withRefs);
          setTimeout(() => {
            generateCodeFromNodes(withRefs);
          }, 0);
        }}
      />
    </div>
    </StructureMetadataProvider>
    </AfterApplyContext.Provider>
  );
}
