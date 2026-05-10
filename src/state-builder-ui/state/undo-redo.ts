import { useRef, useState } from 'react';
import { Stack } from './stack.ts';
import type { UINode, ConstantDefinition, CameraParams, AnimationParams } from '@molstar/state-builder';

export type UndoSnapshot = {
  nodes: UINode[];
  constants: ConstantDefinition[];
  camera: CameraParams | null;
  animation: AnimationParams | null;
};

export function useUndoRedo() {
  const undoStack = useRef(new Stack<UndoSnapshot>());
  const redoStack = useRef(new Stack<UndoSnapshot>());
  const [, forceUpdate] = useState(0);

  const push = (snapshot: UndoSnapshot) => {
    undoStack.current.push(snapshot);
    redoStack.current.clear();
    forceUpdate((n) => n + 1);
  };

  const undo = (current: UndoSnapshot): UndoSnapshot | undefined => {
    if (undoStack.current.isEmpty) return undefined;
    redoStack.current.push(current);
    const prev = undoStack.current.pop();
    forceUpdate((n) => n + 1);
    return prev;
  };

  const redo = (current: UndoSnapshot): UndoSnapshot | undefined => {
    if (redoStack.current.isEmpty) return undefined;
    undoStack.current.push(current);
    const next = redoStack.current.pop();
    forceUpdate((n) => n + 1);
    return next;
  };

  return {
    push,
    undo,
    redo,
    canUndo: !undoStack.current.isEmpty,
    canRedo: !redoStack.current.isEmpty,
  };
}
