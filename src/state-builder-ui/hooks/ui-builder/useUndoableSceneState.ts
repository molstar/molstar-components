import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import {
  UIBuilderNodesAtom,
  UIBuilderConstantsAtom,
  UIBuilderCameraAtom,
  UIBuilderAnimationAtom,
} from '../../state/atoms.ts';
import { useUndoRedo } from '../../state/undo-redo.ts';
import type { UndoSnapshot } from '../../state/undo-redo.ts';
import type { UINode, ConstantDefinition, CameraParams, AnimationParams } from '../../../state-builder/index.ts';

/**
 * Per-scene nodes/constants/camera/animation state, backed by the 4
 * per-scene jotai atoms, plus undo/redo. `applySnapshot`/`applyImportedState`
 * are deliberately state-only — they do NOT trigger code generation; callers
 * (undo/redo button handlers, the import flow) are responsible for calling
 * `useCodeGeneration`'s `generateCodeFromNodes` themselves right after, using
 * the same data. This mirrors the original combined behavior exactly while
 * keeping code generation as a separate concern this hook doesn't know about.
 */
export function useUndoableSceneState(sceneKey: string) {
  const [allNodes, setAllNodes] = useAtom(UIBuilderNodesAtom);
  const nodes = (allNodes[sceneKey] || []) as UINode[];
  const setNodes = (newNodes: UINode[]) => { setAllNodes({ ...allNodes, [sceneKey]: newNodes }); };

  const [allConstants, setAllConstants] = useAtom(UIBuilderConstantsAtom);
  const constants = (allConstants[sceneKey] || []) as ConstantDefinition[];
  const setConstants = (newConstants: ConstantDefinition[]) => { setAllConstants({ ...allConstants, [sceneKey]: newConstants }); };

  const [allCameras, setAllCameras] = useAtom(UIBuilderCameraAtom);
  const camera = allCameras[sceneKey] || null;
  const setCamera = (newCamera: CameraParams | null) => { setAllCameras({ ...allCameras, [sceneKey]: newCamera }); };

  const [allAnimations, setAllAnimations] = useAtom(UIBuilderAnimationAtom);
  const animation = (allAnimations[sceneKey] || null) as AnimationParams | null;
  const setAnimation = (newAnimation: AnimationParams | null) => { setAllAnimations({ ...allAnimations, [sceneKey]: newAnimation }); };

  const { push, undo: rawUndo, redo: rawRedo, canUndo, canRedo } = useUndoRedo();

  // Always-current ref for use in undo/redo (and, via UIBuilder.tsx, the keyboard handler)
  const stateRef = useRef<UndoSnapshot>({ nodes, constants, camera, animation });
  useEffect(() => {
    stateRef.current = { nodes, constants, camera, animation };
  }, [nodes, constants, camera, animation]);

  // History-aware setters — push snapshot before applying change
  const updateNodes = (newNodes: UINode[]) => { push(stateRef.current); setNodes(newNodes); };
  const updateConstants = (newConstants: ConstantDefinition[]) => { push(stateRef.current); setConstants(newConstants); };
  const updateCamera = (newCamera: CameraParams | null) => { push(stateRef.current); setCamera(newCamera); };
  const updateAnimation = (newAnimation: AnimationParams | null) => { push(stateRef.current); setAnimation(newAnimation); };

  const undo = (): UndoSnapshot | undefined => rawUndo(stateRef.current);
  const redo = (): UndoSnapshot | undefined => rawRedo(stateRef.current);

  const applySnapshot = (snap: UndoSnapshot) => {
    setNodes(snap.nodes);
    setConstants(snap.constants);
    setCamera(snap.camera);
    setAnimation(snap.animation);
  };

  const applyImportedState = (imported: { nodes: UINode[]; camera?: CameraParams | null; animation?: AnimationParams | null }) => {
    push(stateRef.current);
    setNodes(imported.nodes);
    if (imported.camera) setCamera(imported.camera);
    if (imported.animation) setAnimation(imported.animation);
  };

  return {
    nodes, constants, camera, animation,
    updateNodes, updateConstants, updateCamera, updateAnimation,
    undo, redo, canUndo, canRedo,
    applySnapshot, applyImportedState,
  };
}
