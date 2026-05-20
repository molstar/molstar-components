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

For installation, bundler setup, and component usage see the
[Installation docs →](https://molstar.org/molstar-components/state-builder-docs.html#installation)

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

To use these components inside another project (e.g. a pnpm monorepo) during
development, build the npm-compatible dist bundle first:

```bash
deno task build:dist
```

This produces `dist/index.js` (React, Molstar, etc. marked external) and
`dist/state-builder-ui.css` (Tailwind utilities). See [DEV.md](./DEV.md) for the full cross-repo setup guide.

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
