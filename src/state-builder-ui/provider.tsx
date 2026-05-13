import { createStore, Provider as JotaiProvider } from 'jotai';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import type { CameraParams, AnimationParams, UINode, ConstantDefinition } from '../state-builder/index.ts';
import {
  SceneKeyAtom, CameraSnapshotAtom, PluginAtom,
  UIBuilderNodesAtom, UIBuilderConstantsAtom, UIBuilderCameraAtom, UIBuilderAnimationAtom
} from './state/atoms.ts';
import { NotificationContext, type NotifyFn } from './state/notifications.ts';
import { CodeGenContext } from './state/codegen-context.ts';
import { AutoGenerateOnMountContext } from './state/auto-generate-context.ts';
import { StateChangeContext, type StateChangeFn } from './state/state-change-context.ts';
import { StoryConstantsContext } from './state/story-constants-context.ts';

/** A point-in-time snapshot of the full builder state for a single scene. */
export interface UIBuilderSnapshot {
  /** MVS node tree representing the current scene structure. */
  nodes: UINode[];
  /** Story-level constant definitions (colors, URLs, etc.). */
  constants: ConstantDefinition[];
  /** Camera position/orientation, or `null` if not set. */
  camera: CameraParams | null;
  /** Animation parameters, or `null` if no animation is configured. */
  animation: AnimationParams | null;
}

/** Imperative handle exposing read/write access to the builder state. */
export interface UIBuilderHandle {
  /** Set the camera from a Molstar snapshot (e.g. captured from the viewer). */
  setCamera: (camera: CameraParams) => void;
  /** Return the current complete builder state as a snapshot. */
  getState: () => UIBuilderSnapshot;
  /** Bulk-set any subset of builder state. Unspecified keys are left unchanged. */
  setState: (snapshot: Partial<UIBuilderSnapshot>) => void;
}

/** Props for `UIBuilderProvider`. */
export interface UIBuilderProviderProps {
  /** React subtree that consumes the builder state (typically `<UIBuilder />`). */
  children: React.ReactNode;
  /** Identifier for the active scene; used to namespace per-scene state atoms. @defaultValue "default" */
  sceneKey?: string;
  /** Molstar plugin instance used for structure metadata and camera capture. */
  plugin?: PluginUIContext | null;
  /** Current camera snapshot from the viewer, forwarded to camera helpers. */
  cameraSnapshot?: unknown;
  /** Called whenever the builder generates new MVS JavaScript code. */
  onCodeGenerated?: (code: string) => void;
  /** Called to surface toast/notification messages to the host application. */
  onNotification?: NotifyFn;
  /** Initial state applied once on mount. Subsequent changes are ignored. */
  initialState?: Partial<UIBuilderSnapshot>;
  /** Per-scene initial state; re-applied whenever `sceneKey` changes. */
  sceneInitialState?: Partial<UIBuilderSnapshot>;
  /** Called on every state mutation with the new state. */
  onStateChange?: StateChangeFn;
  /** When true, triggers code generation automatically on the first mount. @defaultValue false */
  autoGenerateOnMount?: boolean;
  /** Story-level constants shared across all scenes (read-only from the builder). */
  storyConstants?: ConstantDefinition[];
  /** Called when the user edits story-level constants from within the builder. */
  onStoryConstantsChange?: (constants: ConstantDefinition[]) => void;
}

/**
 * Context provider that isolates per-scene builder state using a Jotai store.
 *
 * Accepts an optional `ref` (typed as `UIBuilderHandle`) for imperative access.
 * Wrap one or more `<UIBuilder />` trees inside this provider; all builder
 * components within share the same Jotai store and react to the same atoms.
 *
 * @example
 * ```tsx
 * const ref = useRef<UIBuilderHandle>(null);
 *
 * <UIBuilderProvider ref={ref} onCodeGenerated={setCode}>
 *   <UIBuilder />
 * </UIBuilderProvider>
 * ```
 */
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
      setState: (snapshot: Partial<UIBuilderSnapshot>) => {
        const key = store.get(SceneKeyAtom);
        if (snapshot.nodes !== undefined) {
          store.set(UIBuilderNodesAtom, { ...store.get(UIBuilderNodesAtom), [key]: snapshot.nodes });
        }
        if (snapshot.constants !== undefined) {
          store.set(UIBuilderConstantsAtom, { ...store.get(UIBuilderConstantsAtom), [key]: snapshot.constants });
        }
        if (snapshot.camera !== undefined) {
          store.set(UIBuilderCameraAtom, { ...store.get(UIBuilderCameraAtom), [key]: snapshot.camera });
        }
        if (snapshot.animation !== undefined) {
          store.set(UIBuilderAnimationAtom, { ...store.get(UIBuilderAnimationAtom), [key]: snapshot.animation });
        }
      },
    }));

    return (
      <>
      {/* Styles are inlined here rather than shipped as a separate CSS file.
          JSR's generated package.json only exposes the root "." entry in exports,
          which makes CSS sub-path imports unreliable across bundlers without extra
          consumer configuration. Inlining via React 19's <style precedence> keeps
          the component self-contained — no import required, works with any bundler.

          Theme variables live in @layer state-builder-ui-defaults so any unlayered
          :root declaration in the consumer's stylesheet wins automatically.
          Override by declaring the same variable names outside a @layer in your CSS.

          The input[type=number] rule is scoped to [data-ui-builder] to avoid
          affecting number inputs elsewhere on the page. */}
      <style precedence='low'>{`
@layer state-builder-ui-defaults {
  :root {
    --radius: 0.625rem;
    --background: oklch(1 0 0);
    --foreground: oklch(0.129 0.042 264.695);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.129 0.042 264.695);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.129 0.042 264.695);
    --primary: oklch(0.208 0.042 265.755);
    --primary-foreground: oklch(0.984 0.003 247.858);
    --secondary: oklch(0.968 0.007 247.896);
    --secondary-foreground: oklch(0.208 0.042 265.755);
    --muted: oklch(0.968 0.007 247.896);
    --muted-foreground: oklch(0.554 0.046 257.417);
    --accent: oklch(0.968 0.007 247.896);
    --accent-foreground: oklch(0.208 0.042 265.755);
    --destructive: oklch(0.577 0.245 27.325);
    --border: oklch(0.929 0.013 255.508);
    --input: oklch(0.929 0.013 255.508);
    --ring: oklch(0.704 0.04 256.788);
  }
  .dark {
    --background: oklch(0.129 0.042 264.695);
    --foreground: oklch(0.984 0.003 247.858);
    --card: oklch(0.208 0.042 265.755);
    --card-foreground: oklch(0.984 0.003 247.858);
    --popover: oklch(0.208 0.042 265.755);
    --popover-foreground: oklch(0.984 0.003 247.858);
    --primary: oklch(0.929 0.013 255.508);
    --primary-foreground: oklch(0.208 0.042 265.755);
    --secondary: oklch(0.279 0.041 260.031);
    --secondary-foreground: oklch(0.984 0.003 247.858);
    --muted: oklch(0.279 0.041 260.031);
    --muted-foreground: oklch(0.704 0.04 256.788);
    --accent: oklch(0.279 0.041 260.031);
    --accent-foreground: oklch(0.984 0.003 247.858);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.551 0.027 264.364);
  }
}
.no-spinners::-webkit-outer-spin-button,
.no-spinners::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinners { -moz-appearance: textfield; }
[data-ui-builder] input[type=number]::-webkit-outer-spin-button,
[data-ui-builder] input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
[data-ui-builder] input[type=number] { -moz-appearance: textfield; appearance: textfield; }
`}</style>
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
      </>
    );
  }
);
UIBuilderProvider.displayName = 'UIBuilderProvider';
