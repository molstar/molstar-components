# Cross-Repo Development Guide

## Standard setup (JSR)

Install from JSR — no build step required:

```bash
pnpm add jsr:@molstar/molstar-components
```

### CSS

**Theme variables and utility styles are injected automatically** by `UIBuilderProvider`
via React 19's `<style precedence>` mechanism — no CSS import is required. The styles
are self-contained in the component and work with any bundler without extra configuration.

**Tailwind v4 consumers** — add `@source` in your Tailwind entry CSS so Tailwind scans
the library source and generates the utility classes used by the builder:

```css
/* your Tailwind entry CSS */
@source "<path-to-node_modules>/@molstar/molstar-components/src/state-builder-ui";
```

Adjust the path so it resolves from your CSS file to the package in `node_modules`.
No CSS import from the library is needed — only the `@source` directive.

**Non-Tailwind consumers** — the component renders correctly without Tailwind. The builder
uses utility class names (e.g. `flex`, `gap-2`) that you are responsible for providing
if not using Tailwind. Theme variables (`--background`, `--primary`, etc.) are injected
automatically and can be overridden — see the Theming section below.

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
    }
  },
  "files": ["dist", "src"],
  "peerDependencies": {
    "react": ">=19",
    "react-dom": ">=19",
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

## Styling

`UIBuilderProvider` injects a `<style>` tag (via React 19's `precedence` mechanism)
containing default theme variables and a small number of utility rules. There is no
external CSS file to import. Below are the options for customising or replacing these
styles.

### How the defaults work

All theme variables ship inside `@layer state-builder-ui-defaults`. CSS layers have
lower priority than unlayered rules, so **any `:root` variable you declare outside a
`@layer` automatically wins**, regardless of load order. You don't need to import
anything or coordinate timing.

### Option 1 — Override individual variables (recommended)

Declare the variables you want to change in your own `:root` outside any layer:

```css
:root {
  --primary: oklch(0.5 0.2 220);
  --radius: 0.25rem;
  --background: oklch(0.98 0 0);
}
```

The library uses Shadcn-compatible variable names. If your app already defines these
(e.g. via a Shadcn setup), the builder inherits them automatically with no extra work.

Full variable list (light / dark):

| Variable | Role |
|---|---|
| `--background` / `--foreground` | Page background and text |
| `--card` / `--card-foreground` | Card surfaces |
| `--popover` / `--popover-foreground` | Dropdown/popover surfaces |
| `--primary` / `--primary-foreground` | Primary action colour |
| `--secondary` / `--secondary-foreground` | Secondary surfaces |
| `--muted` / `--muted-foreground` | Muted/disabled text and backgrounds |
| `--accent` / `--accent-foreground` | Hover/focus highlights |
| `--destructive` | Destructive action colour |
| `--border` | Border colour |
| `--input` | Input border colour |
| `--ring` | Focus ring colour |
| `--radius` | Border radius base value |

### Option 2 — Dark mode

Add the `.dark` class to `<html>` or any ancestor container of the builder:

```tsx
<html className={isDark ? 'dark' : ''}>
```

### Option 3 — Scoped overrides per container

Wrap the builder in a container and scope variable overrides to it. This lets the builder
use a different theme from the rest of the app:

```tsx
<div className="my-builder-theme">
  <UIBuilderProvider>
    <UIBuilder />
  </UIBuilderProvider>
</div>
```

```css
.my-builder-theme {
  --primary: oklch(0.5 0.2 220);
  --radius: 0;
}
```

> **Note:** Radix UI components (dropdowns, dialogs, selects) render into portals at
> `document.body`, outside the scoping container. Variables used by portal content must
> also be set on `:root` or `body` to be inherited correctly. Use this option when your
> overrides only affect non-portal elements, or set variables on both.

### Option 4 — Tailwind v4 `@theme`

If you use Tailwind v4, map your design tokens to the library's variable names in your
`@theme` block so both systems share the same values:

```css
@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
  --radius-lg: var(--radius);
}
```

### Option 5 — Complete style replacement

To fully replace the defaults, declare all variables listed above in your own `:root`.
The `@layer state-builder-ui-defaults` block is completely overridden and acts only as
a fallback for variables you don't define. There is currently no prop to suppress the
injected `<style>` tag, but since the layer has the lowest possible cascade priority,
any declaration you make wins without requiring `!important`.

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
| `react` + `react-dom` | 19+ |
| `molstar` | 5.0.0+ |
| `jotai` | 2.x |
| `monaco-editor` | 0.55+ |
| `@radix-ui/*` | as in deno.json |
