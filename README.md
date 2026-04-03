# Molstar Components

[![JSR](https://jsr.io/badges/@molstar/molstar-components)](https://jsr.io/@molstar/molstar-components)
[![JSR Score](https://jsr.io/badges/@molstar/molstar-components/score)](https://jsr.io/@molstar/molstar-components)

Preact components for integrating Molstar molecular viewer with interactive
Monaco editor support for MolViewSpec.

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

This produces `dist/index.js` (React, Molstar, etc. marked external) and the
required CSS files. See [DEV.md](./DEV.md) for the full cross-repo setup guide.

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
