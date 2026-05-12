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

// Deno import-map aliases for monaco sub-paths (e.g. "monaco-editor/typescript-contribution")
// are not valid npm package exports. Depending on whether esbuild's external check fires
// before or after denoPlugins, the output contains one of two broken forms:
//   A) verbatim alias: "monaco-editor/typescript-contribution"
//   B) wrong prefix:   "monaco-editor/esm/vs/editor/editor.api.js/esm/vs/..."
//      (denoPlugins resolved the alias via the npm: chain and prepended the main-entry path)
// We fix both forms after the build.
async function fixMonacoSubPaths(file: string) {
  let src = await Deno.readTextFile(file);

  // Fix form B: strip the spurious main-entry prefix produced by denoLoaderPlugin's npm resolution
  src = src.replaceAll(
    "monaco-editor/esm/vs/editor/editor.api.js/",
    "monaco-editor/",
  );

  // Fix form A: rewrite verbatim Deno aliases to real npm sub-paths
  const aliasRewrites: Record<string, string> = {
    '"monaco-editor/typescript-contribution"':
      '"monaco-editor/esm/vs/language/typescript/monaco.contribution"',
    '"monaco-editor/javascript-language"':
      '"monaco-editor/esm/vs/basic-languages/javascript/javascript"',
    '"monaco-editor/workers/editor"':
      '"monaco-editor/esm/vs/editor/editor.worker"',
    '"monaco-editor/workers/typescript"':
      '"monaco-editor/esm/vs/language/typescript/ts.worker"',
  };
  for (const [alias, real] of Object.entries(aliasRewrites)) {
    src = src.replaceAll(alias, real);
  }

  await Deno.writeTextFile(file, src);
}

try {
  // 1. Build the JS bundle with peer deps external
  console.log("Building dist/index.js (peer deps external)...");
  await esbuild.build({
    plugins: [...denoPlugins({ configPath })] as any,
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
      "monaco-editor", "monaco-editor/*",
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
  await fixMonacoSubPaths("./dist/index.js");
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
