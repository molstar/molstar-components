# Cross-Repo Development Guide

How to use `molstar-components` locally inside a pnpm monorepo (e.g. `mol-view-stories`)
while actively developing both repos.

## Overview

`molstar-components` is a Deno project published to JSR. For local development
inside a pnpm monorepo, we build a `dist/` bundle with peer dependencies marked
external (React, Molstar, Radix UI, etc. are provided by the host app) and
reference it via pnpm's `file:` protocol, which pnpm installs into its virtual store.

## Prerequisites

- `molstar-components` cloned at `~/dev/molstar-components`
- `mol-view-stories` (or your pnpm project) cloned at `~/dev/mol-view-stories`

## One-time setup

### Step 1 — Build the dist bundle

```bash
cd ~/dev/molstar-components
deno task build:dist
# produces dist/index.js, dist/state-builder-ui.css, dist/molstar.css
```

### Step 2 — Add the file: dependency

In your consuming workspace package (e.g. `@mol-view-stories/webapp`), edit `package.json`:

```json
"@molstar/molstar-components": "file:../../../molstar-components"
```

(adjust the relative path to wherever `molstar-components` lives relative to `package.json`)

Then install:

```bash
cd ~/dev/mol-view-stories
pnpm install
```

### Step 3 — Import CSS

The library ships pre-built CSS. Import it **before** your app's own global styles so
the app's Tailwind base resets take precedence:

```ts
// layout.tsx or equivalent — library CSS first, app CSS last
import '@molstar/molstar-components/state-builder-ui.css';
import 'molstar/build/viewer/molstar.css';
import './globals.css';  // app Tailwind — wins over library resets
```

### Step 4 — TypeScript paths (for type resolution through library source)

Add to your `tsconfig.json` paths so TypeScript can follow types into the vendored source:

```json
"@molstar/state-builder": ["../../../molstar-components/src/state-builder/index.ts"],
"@molstar/state-builder/*": ["../../../molstar-components/src/state-builder/*"]
```

### Step 5 — Use the components

```tsx
import { BuilderWithViewer, MolViewStateBuilder, UIBuilderProvider, UIBuilder } from "@molstar/molstar-components";
```

## Day-to-day workflow

After editing source in `molstar-components`:

```bash
cd ~/dev/molstar-components
deno task build:dist
cd ~/dev/mol-view-stories && pnpm install   # re-copies updated dist into pnpm store
# restart Next.js dev server to pick up changes
```

> Note: pnpm `file:` installs a copy into the virtual store (not a live symlink), so
> `pnpm install` is needed after each rebuild to pick up changes.

---

## UIBuilderProvider props reference

```tsx
interface UIBuilderProviderProps {
  children: React.ReactNode;

  /** Scene identifier — scopes all state per-scene (default: 'default') */
  sceneKey?: string;

  /** Mol* PluginUIContext instance — enables camera capture and structure metadata */
  plugin?: PluginUIContext | null;

  /** Current camera snapshot from Mol* — populates "Capture from Viewer" buttons */
  cameraSnapshot?: unknown;

  /** Called when the user clicks "Generate Code" — receives generated JS string */
  onCodeGenerated?: (code: string) => void;

  /** Notification handler — wire to sonner, react-hot-toast, etc. */
  onNotification?: (n: { type: 'success' | 'error'; message: string }) => void;

  /** Initial state to load on mount — useful for restoring saved sessions */
  initialState?: Partial<UIBuilderSnapshot>;

  /** Per-scene initial state (applied when sceneKey is first visited) */
  sceneInitialState?: Partial<UIBuilderSnapshot>;

  /** Called when switching scenes — receives the outgoing scene's full state */
  onStateChange?: (state: UIBuilderSnapshot) => void;

  /** Auto-generate code on mount (requires initialState.nodes to be non-empty) */
  autoGenerateOnMount?: boolean;

  /** Story-level constants passed down to all scenes (read-only in the builder) */
  storyConstants?: ConstantDefinition[];

  /** Called when story-level constants change */
  onStoryConstantsChange?: (constants: ConstantDefinition[]) => void;
}
```

## Theming

CSS variables are declared in `@layer state-builder-ui-defaults`, so any consumer
variable declarations outside a layer (or in a higher-priority layer) win automatically:

```css
:root {
  --primary: oklch(0.5 0.2 220);
  --radius: 0.25rem;
}
```

The library follows Shadcn variable naming (`--primary`, `--muted-foreground`, `--radius`, etc.).
If your app already defines these variables, the builder inherits them with no extra config.

Dark mode: add the `.dark` class to `<html>` or a container element.

## Mol* viewer integration

Pass `plugin` and `cameraSnapshot` to enable viewer-specific features:

```tsx
<UIBuilderProvider
  plugin={molstarPlugin}
  cameraSnapshot={currentCameraSnapshot}
  onCodeGenerated={(code) => runCode(code)}
>
  <UIBuilder />
</UIBuilderProvider>
```

- `plugin` enables: "Capture from Viewer" camera button, structure metadata (chain/residue/ligand selectors in SelectorHelper)
- `cameraSnapshot` populates the camera section with the current viewer position

Capture `cameraSnapshot` by subscribing to `plugin.canvas3d?.didDraw`:

```tsx
plugin.canvas3d?.didDraw.subscribe(() => {
  setCameraSnapshot(plugin.canvas3d?.camera.getSnapshot() ?? null);
});
```

## State management

### Per-scene isolation with `sceneKey`

```tsx
<UIBuilderProvider sceneKey={activeSceneId}>
  <UIBuilder />
</UIBuilderProvider>
```

Each unique `sceneKey` maintains separate node, camera, animation, and constants state.
Switching `sceneKey` automatically saves the outgoing scene (via `onStateChange`) and
restores the incoming one (via `sceneInitialState`).

### Restoring saved state

```tsx
<UIBuilderProvider
  sceneKey={sceneId}
  sceneInitialState={{
    nodes: savedNodes,
    constants: savedConstants,
    camera: savedCamera,
    animation: savedAnimation,
  }}
  onStateChange={(state) => saveSceneState(sceneId, state)}
>
  <UIBuilder />
</UIBuilderProvider>
```

## Imperative API

Use `UIBuilderProvider`'s ref to interact programmatically:

```tsx
const builderRef = useRef<UIBuilderHandle>(null);

// Set camera from external source
builderRef.current?.setCamera({ position: [0, 0, 100], target: [0, 0, 0] });

// Read current state
const state = builderRef.current?.getState();
// → { nodes, constants, camera, animation }
```

```tsx
<UIBuilderProvider ref={builderRef} sceneKey={sceneId}>
  <UIBuilder />
</UIBuilderProvider>
```

## Notifications

Wire `onNotification` to your toast library:

```tsx
import { toast } from 'sonner';

<UIBuilderProvider
  onNotification={(n) =>
    n.type === 'error' ? toast.error(n.message) : toast.success(n.message)
  }
>
```

If `onNotification` is not provided, messages fall back to `console.log`.

## Peer dependency versions

| Package | Minimum |
|---------|---------|
| `react` + `react-dom` | 18+ |
| `molstar` | 5.0.0+ |
| `jotai` | 2.x |
| `monaco-editor` | 0.55+ |
| `@radix-ui/*` | as in deno.json |

## Published package

For production / CI, install from JSR:

```bash
pnpm add jsr:@molstar/molstar-components
```
