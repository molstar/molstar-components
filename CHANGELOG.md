# Changelog

## 0.6.0-experimental.3 (2026-05-12)

### Breaking changes

- **React 19+ required.** `UIBuilderProvider` now injects theme styles via React 19's
  `<style precedence>` API. React 18 is no longer supported.

### Changes

- **CSS is self-contained.** Theme variables and utility styles are injected automatically
  by `UIBuilderProvider` — no CSS file import is needed. The `styles.css` file is removed.
  Tailwind v4 consumers only need an `@source` directive pointing at the library's
  `src/state-builder-ui` directory.

- `input[type=number]` spinner-hiding rule is now scoped to `[data-ui-builder]` instead
  of being a global selector.

- Module documentation updated to cover all components including the state builder.

---

## 0.6.0-experimental.0 (2026-05-10)

Experimental React migration. The API may still change before a stable 0.6.x release.

### Breaking changes

- **React instead of Preact.** The peer dependency is now `react@19+` and `react-dom@19+`.
  Replace `preact` and `preact/hooks` imports with `react` in your application.

- **Molstar is a peer dependency — CDN loading removed.** Version 0.5.x could inject
  Molstar from a CDN at runtime. 0.6.x requires the consuming app to bundle Molstar
  (5.7+) itself and pass a `PluginUIContext` instance where needed.

- **`MolViewEditor` new required peer: `monaco-editor@0.55+`.** The editor no longer
  accepts a lazily-loaded Monaco instance; Monaco must be available in the bundle.

- **`MolViewEditor` — new props:** `value` (controlled input), `commonCode`,
  `className`, `onEditorMount`, `hybridMode`, `plugin`, `cameraSnapshot`,
  `diagnosticCodesToIgnore`.

### New components

- `MolViewStateBuilder` — standalone visual MVS node-tree builder with imperative
  `ref` handle (`UIBuilderHandle`).
- `BuilderWithViewer` — builder + Molstar viewer side by side.
- `BuilderWithEditorAndViewer` — full three-panel combo: builder + editor + viewer.
- `UIBuilderProvider` / `UIBuilder` — lower-level primitives for custom layouts.

### New hooks & utilities

- `useSyncToBuilder` — evaluates MVS JavaScript and pushes the result into a
  `UIBuilderHandle`.
- `evaluateCodeToMVSTree` — run MVS builder code and get a raw MVS tree back.
- `snapshotToCameraParams` — convert a Molstar camera snapshot to `CameraParams`.
- `filterMetadataBySelector` — filter extracted structure metadata by a selector.

### Other changes

- Molstar peer dependency bumped to **5.8.0**.
- Package scope moved from `@zachcp` to **`@molstar`** (already done in 0.5.x stable
  releases; documented here for completeness).

---

## 0.5.2 (2026-04-03)

Last stable Preact-based release. Use 0.5.x if you need a stable API without the
visual state builder.

### Changes

- Dependency bumps and minor fixes.

## 0.5.0 (2026-01-14)

- Moved package scope from `@zachcp/molstar-components` to `@molstar/molstar-components`.
- Stable Preact-based release with `MolstarViewer`, `MolViewEditor`, `EditorWithViewer`.
