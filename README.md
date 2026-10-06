# Molstar Components

[![JSR](https://jsr.io/badges/@molstar/molstar-components)](https://jsr.io/@molstar/molstar-components)
[![JSR Score](https://jsr.io/badges/@molstar/molstar-components/score)](https://jsr.io/@molstar/molstar-components)

React components for integrating Molstar molecular viewer with interactive
Monaco editor support for MolViewSpec, and a visual state builder UI.

## Versions

| Version | Runtime | Components |
|---------|---------|------------|
| **0.5.x** | Preact (stable) | `MolstarViewer`, `EditorWithViewer` |
| **0.6.x** | React (experimental) | above + `MolViewStateBuilder`, `BuilderWithViewer`, `BuilderWithEditorAndViewer` |

**0.5.x** is the stable Preact-based release. Use it if you only need the viewer
and editor and want a stable API.

**0.6.x** is an experimental React migration that adds the visual State Builder.
The API may still change before a stable release.

For bundler setup and component usage see the
[Installation docs →](https://molstar.org/molstar-components/state-builder-docs.html#installation)

## Installation

```bash
# JSR (Deno-native; Node/pnpm consumers need bundler glue — see DEV.md)
pnpm add jsr:@molstar/molstar-components

# npm (Node/bundler projects — no JSR-specific glue needed)
npm install @molstar/molstar-components
```

## Development

```bash
# Bundle and start development server
deno task dev

# Open http://localhost:8000/docs/index-dev.html
```

This bundles your local source files and serves them at
`docs/molstar-components.dev.js`, allowing you to test changes by refreshing the
browser.

## Cross-repo / pnpm development

To test a local build against another project (e.g. a pnpm monorepo) before
publishing, build the npm-compatible package first:

```bash
deno task pack:npm
```

This produces `dist/npm/` (compiled JS + `.d.ts` + `package.json` with proper
`peerDependencies`). See [DEV.md](./DEV.md) for the full cross-repo setup guide.

## Updating molstar

When bumping the `molstar` version in `deno.json`, regenerate the Monaco editor
type definitions to match:

```bash
deno task mvs-types
```

This re-bundles the molstar type declarations and updates `src/utils/mvs-types.ts`.

## Publishing

```bash
# Lint and type check
deno lint
deno check

# Publish (or use git tags for CI)
deno publish
```

## License

MIT
