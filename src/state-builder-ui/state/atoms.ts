import { atom } from 'jotai';
import type { AnimationParams, CameraParams } from '@molstar/state-builder';
import type { UINode, ConstantDefinition } from '@molstar/state-builder';

export const SceneKeyAtom = atom<string>('default');
export const CameraSnapshotAtom = atom(null as unknown);
export const PluginAtom = atom(null as unknown);

export const UIBuilderNodesAtom = atom<Record<string, UINode[]>>({});
export const UIBuilderConstantsAtom = atom<Record<string, ConstantDefinition[]>>({});
export const UIBuilderCameraAtom = atom<Record<string, CameraParams | null>>({});
export const UIBuilderAnimationAtom = atom<Record<string, AnimationParams | null>>({});
