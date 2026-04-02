import { createStore, Provider as JotaiProvider } from 'jotai';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import type { CameraParams, AnimationParams, UINode, ConstantDefinition } from '@molstar/state-builder';
import {
  SceneKeyAtom, CameraSnapshotAtom, PluginAtom,
  UIBuilderNodesAtom, UIBuilderConstantsAtom, UIBuilderCameraAtom, UIBuilderAnimationAtom
} from './state/atoms.ts';
import { NotificationContext, type NotifyFn } from './state/notifications.ts';
import { CodeGenContext } from './state/codegen-context.ts';
import { AutoGenerateOnMountContext } from './state/auto-generate-context.ts';
import { StateChangeContext, type StateChangeFn } from './state/state-change-context.ts';
import { StoryConstantsContext } from './state/story-constants-context.ts';

export interface UIBuilderSnapshot {
  nodes: UINode[];
  constants: ConstantDefinition[];
  camera: CameraParams | null;
  animation: AnimationParams | null;
}

export interface UIBuilderHandle {
  setCamera: (camera: CameraParams) => void;
  getState: () => UIBuilderSnapshot;
}

export interface UIBuilderProviderProps {
  children: React.ReactNode;
  sceneKey?: string;
  plugin?: PluginUIContext | null;
  cameraSnapshot?: unknown;
  onCodeGenerated?: (code: string) => void;
  onNotification?: NotifyFn;
  initialState?: Partial<UIBuilderSnapshot>;
  sceneInitialState?: Partial<UIBuilderSnapshot>;
  onStateChange?: StateChangeFn;
  autoGenerateOnMount?: boolean;
  storyConstants?: ConstantDefinition[];
  onStoryConstantsChange?: (constants: ConstantDefinition[]) => void;
}

export const UIBuilderProvider: ForwardRefExoticComponent<
  UIBuilderProviderProps & RefAttributes<UIBuilderHandle>
> = forwardRef<UIBuilderHandle, UIBuilderProviderProps>(
  (
    {
      children, sceneKey = 'default', plugin, cameraSnapshot,
      onCodeGenerated, onNotification, initialState,
      sceneInitialState, onStateChange, autoGenerateOnMount,
      storyConstants, onStoryConstantsChange,
    },
    ref
  ) => {
    const storeRef = useRef(createStore());
    const store = storeRef.current;

    // Sync props to atoms
    useEffect(() => { store.set(SceneKeyAtom, sceneKey); }, [store, sceneKey]);
    useEffect(() => { store.set(CameraSnapshotAtom, cameraSnapshot ?? null); }, [store, cameraSnapshot]);
    useEffect(() => { store.set(PluginAtom, plugin ?? null); }, [store, plugin]);

    // Apply initialState (runs once on mount, backward compat)
    useEffect(() => {
      if (!initialState) return;
      const key = sceneKey;
      if (initialState.nodes) store.set(UIBuilderNodesAtom, { [key]: initialState.nodes });
      if (initialState.constants) store.set(UIBuilderConstantsAtom, { [key]: initialState.constants });
      if (initialState.camera !== undefined) store.set(UIBuilderCameraAtom, { [key]: initialState.camera });
      if (initialState.animation !== undefined) store.set(UIBuilderAnimationAtom, { [key]: initialState.animation });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally run only once on mount

    // Multi-scene persistence: initialize incoming scene from persisted state
    const initializedKeys = useRef(new Set<string>());
    const prevSceneKeyRef = useRef(sceneKey);

    useEffect(() => {
      const oldKey = prevSceneKeyRef.current;

      // Phase 1: save outgoing scene state before switching
      if (oldKey !== sceneKey && onStateChange) {
        onStateChange({
          nodes:     (store.get(UIBuilderNodesAtom)[oldKey]     ?? []) as UINode[],
          constants: (store.get(UIBuilderConstantsAtom)[oldKey] ?? []) as ConstantDefinition[],
          camera:    store.get(UIBuilderCameraAtom)[oldKey]     ?? null,
          animation: store.get(UIBuilderAnimationAtom)[oldKey]  ?? null,
        });
      }
      prevSceneKeyRef.current = sceneKey;

      // Phase 2: initialize incoming scene from persisted state (only if not yet visited)
      if (!initializedKeys.current.has(sceneKey) && sceneInitialState) {
        const nodes     = store.get(UIBuilderNodesAtom);
        const constants = store.get(UIBuilderConstantsAtom);
        const cameras   = store.get(UIBuilderCameraAtom);
        const anims     = store.get(UIBuilderAnimationAtom);
        if (sceneInitialState.nodes)                store.set(UIBuilderNodesAtom,     { ...nodes,     [sceneKey]: sceneInitialState.nodes });
        if (sceneInitialState.constants)            store.set(UIBuilderConstantsAtom, { ...constants, [sceneKey]: sceneInitialState.constants });
        if (sceneInitialState.camera    !== undefined) store.set(UIBuilderCameraAtom,    { ...cameras,   [sceneKey]: sceneInitialState.camera });
        if (sceneInitialState.animation !== undefined) store.set(UIBuilderAnimationAtom, { ...anims,     [sceneKey]: sceneInitialState.animation });
      }
      initializedKeys.current.add(sceneKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sceneKey]); // sceneInitialState excluded intentionally — always read latest via closure

    useImperativeHandle(ref, () => ({
      setCamera: (camera: CameraParams) => {
        const key = store.get(SceneKeyAtom);
        const allCameras = store.get(UIBuilderCameraAtom);
        store.set(UIBuilderCameraAtom, { ...allCameras, [key]: camera });
      },
      getState: () => {
        const key = store.get(SceneKeyAtom);
        return {
          nodes: (store.get(UIBuilderNodesAtom)[key] || []) as UINode[],
          constants: (store.get(UIBuilderConstantsAtom)[key] || []) as ConstantDefinition[],
          camera: store.get(UIBuilderCameraAtom)[key] || null,
          animation: store.get(UIBuilderAnimationAtom)[key] || null,
        };
      },
    }));

    return (
      <JotaiProvider store={store}>
        <NotificationContext.Provider value={onNotification ?? null}>
          <AutoGenerateOnMountContext.Provider value={autoGenerateOnMount ?? false}>
          <CodeGenContext.Provider value={onCodeGenerated ?? null}>
            <StateChangeContext.Provider value={onStateChange ?? null}>
              <StoryConstantsContext.Provider value={{
                storyConstants: storyConstants ?? [],
                onStoryConstantsChange: onStoryConstantsChange ?? null,
              }}>
                {children}
              </StoryConstantsContext.Provider>
            </StateChangeContext.Provider>
          </CodeGenContext.Provider>
          </AutoGenerateOnMountContext.Provider>
        </NotificationContext.Provider>
      </JotaiProvider>
    );
  }
);
UIBuilderProvider.displayName = 'UIBuilderProvider';
