#!/usr/bin/env -S deno run --allow-all
/// <reference lib="deno.ns" />
// deno-lint-ignore-file no-explicit-any

/**
 * Builds the npm-compatible library distribution in dist/.
 * All peer dependencies (React, Molstar, Radix UI, etc.) are marked external
 * so the consuming app provides them — no duplicate instances.
 *
 * Usage:
 *   deno task build:dist
 */

import * as esbuild from "esbuild";
import { denoPlugins } from "@luca/esbuild-deno-loader";
import { resolve } from "@std/path";

const configPath = resolve(Deno.cwd(), "./deno.json");

// esbuild checks `external` against the raw import specifier *before* plugins run,
// so Deno import-map aliases like "monaco-editor/typescript-contribution" would be
// kept verbatim if caught by the "monaco-editor/*" wildcard — producing an import
// that webpack/turbopack cannot resolve at runtime. Instead we let this plugin run
// first: it rewrites the known Deno aliases to their real npm sub-paths and marks
// those real paths as external, so the output contains valid resolvable specifiers.
const monacoAliasExternals: esbuild.Plugin = {
  name: "monaco-alias-externals",
  setup(build) {
    const aliasMap: Record<string, string> = {
      "monaco-editor/typescript-contribution":
        "monaco-editor/esm/vs/language/typescript/monaco.contribution",
      "monaco-editor/javascript-language":
        "monaco-editor/esm/vs/basic-languages/javascript/javascript",
      "monaco-editor/workers/editor":
        "monaco-editor/esm/vs/editor/editor.worker",
      "monaco-editor/workers/typescript":
        "monaco-editor/esm/vs/language/typescript/ts.worker",
    };
    build.onResolve({ filter: /^monaco-editor\// }, (args) => {
      const real = aliasMap[args.path] ?? args.path;
      return { path: real, external: true };
    });
  },
};

try {
  // 1. Build the JS bundle with peer deps external
  console.log("Building dist/index.js (peer deps external)...");
  await esbuild.build({
    // monacoAliasExternals must be listed before denoPlugins so it intercepts
    // the Deno import-map aliases before esbuild's external wildcard can catch them.
    plugins: [monacoAliasExternals, ...denoPlugins({ configPath })] as any,
    entryPoints: ["./src/mod.ts"],
    outfile: "./dist/index.js",
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    jsxImportSource: "react",
    external: [
      "react", "react/jsx-runtime", "react/jsx-dev-runtime",
      "react-dom", "react-dom/*",
      "jotai", "jotai/*",
      "monaco-editor",   // exact match for the main entry; sub-paths handled by plugin above
      "molstar", "molstar/*",
      "@radix-ui/*",
      "lucide-react",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
    ],
    loader: {
      ".ttf": "file", ".woff": "file", ".woff2": "file", ".eot": "file",
    },
    assetNames: "assets/[name]-[hash]",
    publicPath: "./",
  });
  console.log("✓ dist/index.js");

  // 2. Build Tailwind CSS for state-builder-ui components
  console.log("Building dist/state-builder-ui.css...");
  const cssCmd = new Deno.Command("deno", {
    args: [
      "run", "--allow-read", "--allow-write",
      "--allow-env", "--allow-sys", "--allow-net", "--allow-ffi",
      "npm:@tailwindcss/cli@4",
      "-i", "./docs/tailwind-entry.css",
      "-o", "./dist/state-builder-ui.css",
      "--minify",
    ],
    stdout: "inherit",
    stderr: "inherit",
  });
  const cssResult = await cssCmd.output();
  if (!cssResult.success) throw new Error("Tailwind CSS build failed");
  console.log("✓ dist/state-builder-ui.css");

  // 3. Copy molstar CSS
  console.log("Copying molstar CSS...");
  await Deno.copyFile(
    "./node_modules/molstar/build/viewer/molstar.css",
    "./dist/molstar.css",
  );
  console.log("✓ dist/molstar.css");

  console.log("\nDist build complete.");
} catch (error) {
  console.error("Build failed:", error);
  Deno.exit(1);
} finally {
  esbuild.stop();
}
