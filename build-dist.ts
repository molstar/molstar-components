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
// are not valid npm package exports. denoResolverPlugin runs before esbuild's external check,
// so it resolves the aliases to npm: specifiers, and denoLoaderPlugin then produces broken
// concatenated paths in the output. We intercept ALL monaco imports before denoPlugins sees
// them, rewriting Deno aliases to real npm sub-paths and marking everything external.
const monacoExternalPlugin: esbuild.Plugin = {
  name: "monaco-external",
  setup(build) {
    const aliasMap: Record<string, string> = {
      "monaco-editor/typescript-contribution":
        "monaco-editor/esm/vs/language/typescript/monaco.contribution",
      "monaco-editor/javascript-language":
        "monaco-editor/esm/vs/basic-languages/javascript/javascript",
      "monaco-editor/markdown-language":
        "monaco-editor/esm/vs/basic-languages/markdown/markdown",
      "monaco-editor/workers/editor":
        "monaco-editor/esm/vs/editor/editor.worker",
      "monaco-editor/workers/typescript":
        "monaco-editor/esm/vs/language/typescript/ts.worker",
    };
    build.onResolve({ filter: /^monaco-editor(\/|$)/ }, (args) => {
      const realPath = aliasMap[args.path] ?? args.path;
      return { path: realPath, external: true };
    });
  },
};

async function verifyDist(file: string) {
  const src = await Deno.readTextFile(file);
  const broken = "monaco-editor/esm/vs/editor/editor.api.js/";
  if (src.includes(broken)) {
    throw new Error(
      `dist still contains broken monaco path: ${broken}\nRun locally to debug.`,
    );
  }
  const aliases = [
    "monaco-editor/typescript-contribution",
    "monaco-editor/javascript-language",
    "monaco-editor/workers/editor",
    "monaco-editor/workers/typescript",
  ];
  for (const alias of aliases) {
    if (src.includes(`"${alias}"`)) {
      throw new Error(`dist still contains unresolved Deno alias: "${alias}"`);
    }
  }
}

try {
  // 1. Build the JS bundle with peer deps external
  console.log("Building dist/index.js (peer deps external)...");
  await esbuild.build({
    plugins: [monacoExternalPlugin, ...denoPlugins({ configPath })] as any,
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
  await verifyDist("./dist/index.js");
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

  // 4. Generate TypeScript declarations
  // tsc is run via node directly to pass --stack-size, which is required because
  // molstar's type graph is deep enough to overflow node's default call stack.
  console.log("Generating TypeScript declarations...");
  const tscPath = new URL("./node_modules/.bin/tsc", import.meta.url).pathname;
  const tscCmd = new Deno.Command("node", {
    args: ["--stack-size=65536", tscPath, "-p", "tsconfig.declarations.json"],
    stdout: "inherit",
    stderr: "inherit",
  });
  const tscResult = await tscCmd.output();
  if (!tscResult.success) throw new Error("TypeScript declaration generation failed");
  // Rename entry declaration to match dist/index.js convention
  await Deno.rename("./dist/mod.d.ts", "./dist/index.d.ts");
  console.log("✓ dist/index.d.ts");

  console.log("\nDist build complete.");
} catch (error) {
  console.error("Build failed:", error);
  Deno.exit(1);
} finally {
  esbuild.stop();
}
