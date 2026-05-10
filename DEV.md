# Cross-Repo Development Guide

## Standard setup (JSR)

Install from JSR — no build step required:

```bash
pnpm add jsr:@molstar/molstar-components
```

### CSS

The library ships CSS variables via the `state-builder-ui.css` sub-path export.
Import it before your app's own global styles, then point Tailwind at the
library source so it scans and generates the utility classes:

```ts
// layout.tsx (or equivalent) — import CSS variables
import '@molstar/molstar-components/state-builder-ui.css';
import 'molstar/build/viewer/molstar.css';
import './globals.css';
```

In your Tailwind entry CSS, add an `@source` pointing at the library's
`src/state-builder-ui` directory inside `node_modules`:

```css
@source "<path-to-node_modules>/@molstar/molstar-components/src/state-builder-ui";
```

The exact relative path depends on where your CSS file lives relative to
`node_modules` in your project. The library's `src/state-builder-ui/styles.css`
contains only CSS variable defaults (in `@layer state-builder-ui-defaults`);
they lose to any non-layered `:root` declarations your app defines.

---

## Local file: development (active editing of both repos)

Use this only when actively editing `molstar-components` and `mol-view-stories`
in parallel. Normal consumption uses JSR above.

### Step 1 — Create a local `package.json`

`package.json` is gitignored in this repo. Create it manually at the repo root:

```json
{
  "name": "@molstar/molstar-components",
  "version": "0.6.0-experimental.1",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./src/mod.ts"
    },
    "./state-builder-ui.css": "./dist/state-builder-ui.css",
    "./molstar.css": "./dist/molstar.css"
  },
  "files": ["dist", "src"],
  "sideEffects": ["*.css"],
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
    "molstar": ">=5.0.0",
    "jotai": ">=2.0.0",
    "monaco-editor": ">=0.55.0"
  }
}
```

### Step 2 — Build the dist bundle

```bash
cd ~/dev/molstar-components
deno task build:dist
# produces dist/index.js, dist/state-builder-ui.css, dist/molstar.css
```

### Step 3 — Add the file: dependency

In the consuming workspace package (e.g. `@mol-view-stories/webapp`), set:

```json
"@molstar/molstar-components": "file:../../../molstar-components"
```

Then install:

```bash
cd ~/dev/mol-view-stories
pnpm install
```

### Step 4 — TypeScript paths (optional)

For type resolution directly into library source, add to `tsconfig.json`:

```json
"@molstar/state-builder": ["../../../molstar-components/src/state-builder/index.ts"],
"@molstar/state-builder/*": ["../../../molstar-components/src/state-builder/*"]
```

### Day-to-day workflow

After editing source in `molstar-components`:

```bash
cd ~/dev/molstar-components
deno task build:dist
cd ~/dev/mol-view-stories && pnpm install
# restart Next.js dev server
```

> pnpm `file:` installs a copy into the virtual store (not a symlink), so
> `pnpm install` is required after every rebuild.

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
