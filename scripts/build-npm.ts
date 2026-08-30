#!/usr/bin/env -S deno run --allow-all
// @ts-ignore
/// <reference lib="deno.ns" />

/**
 * Builds a publishable npm package directory at dist/npm/ via `deno pack`,
 * then patches the two things deno pack doesn't get right for a component
 * library: everything lands in flat `dependencies` (would give every
 * consumer their own copy of React/Molstar/etc.), and `react-dom` is
 * missing entirely (nothing in src/ calls it directly, but consumers need
 * it installed). CSS needs no handling — see src/state-builder-ui/provider.tsx
 * for why (theme vars are runtime-injected; Tailwind utilities come from
 * each consumer's own build scanning this package's source).
 *
 * Does NOT run `npm publish` — that's a manual step once dist/npm/ looks
 * right: `cd dist/npm && npm publish`.
 */

// @ts-ignore
const denoJson = JSON.parse(await Deno.readTextFile("./deno.json"));
const imports: Record<string, string> = denoJson.imports ?? {};

/** Packages that must be peerDependencies, not bundled-in dependencies —
 * every one of these is a component/rendering library the consuming app
 * itself installs; duplicating them causes duplicate-React-instance bugs. */
const PEER_PACKAGE_NAMES = [
  "react",
  "molstar",
  "jotai",
  "monaco-editor",
  "@radix-ui/react-dialog",
  "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-label",
  "@radix-ui/react-select",
  "@radix-ui/react-slot",
  "@radix-ui/react-switch",
  "@radix-ui/react-tabs",
  "class-variance-authority",
  "clsx",
  "lucide-react",
  "tailwind-merge",
];

/** Derives `pkg@version` -> version for a bare package name from deno.json's
 * `imports` map (same npm: parsing approach as scripts/generate-aliases.ts).
 * Used only for react-dom, which deno pack's dependency extraction misses
 * entirely since nothing in src/ imports it directly. */
function versionFromImports(pkgName: string): string | undefined {
  for (const value of Object.values(imports)) {
    if (!value.startsWith("npm:")) continue;
    const rest = value.slice(4); // strip "npm:"
    const match = rest.match(/^(@[^/]+\/[^@/]+|[^@/]+)@([^/]+)/);
    if (match && match[1] === pkgName) return match[2];
  }
  return undefined;
}

const outDir = "dist/npm";
const tarballPath = "dist/npm.tgz";

await Deno.mkdir("dist", { recursive: true });
await Deno.remove(outDir, { recursive: true }).catch(() => {});

console.log("Running deno pack...");
const packCmd = new Deno.Command("deno", {
  // @ts-ignore
  args: [
    "pack",
    "-o",
    tarballPath,
    "--ignore=src/state-builder/cli/**",
    // @ts-ignore
    ...Deno.args, // e.g. --allow-dirty for local iteration
  ],
  stdout: "inherit",
  stderr: "inherit",
});
const packResult = await packCmd.output();
if (!packResult.success) {
  console.error(
    "deno pack failed. If this is a dirty working tree during local iteration, " +
      "commit or stash first — deno pack refuses uncommitted changes by design " +
      "(reproducible releases from a commit hash).",
  );
  Deno.exit(1);
}

console.log(`Extracting ${tarballPath} into ${outDir}...`);
await Deno.mkdir(outDir, { recursive: true });
const tarCmd = new Deno.Command("tar", {
  args: ["-xzf", tarballPath, "-C", outDir, "--strip-components=1"],
  stdout: "inherit",
  stderr: "inherit",
});
const tarResult = await tarCmd.output();
if (!tarResult.success) {
  console.error("Failed to extract the pack tarball.");
  Deno.exit(1);
}

const pkgJsonPath = `${outDir}/package.json`;
// @ts-ignore
const pkgJson = JSON.parse(await Deno.readTextFile(pkgJsonPath));

pkgJson.dependencies ??= {};
pkgJson.peerDependencies ??= {};

for (const name of PEER_PACKAGE_NAMES) {
  const version = pkgJson.dependencies[name];
  if (version === undefined) continue;
  delete pkgJson.dependencies[name];
  pkgJson.peerDependencies[name] = version;
}

const reactDomVersion = versionFromImports("react-dom");
if (reactDomVersion) {
  pkgJson.peerDependencies["react-dom"] = `^${reactDomVersion}`;
} else {
  console.warn(
    "Warning: could not derive a react-dom version from deno.json's imports " +
      "map — react-dom was NOT added to peerDependencies. Add it manually.",
  );
}

if (Object.keys(pkgJson.dependencies).length === 0) {
  delete pkgJson.dependencies;
}

// @ts-ignore
await Deno.writeTextFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");

console.log(`\nFinal ${pkgJsonPath}:\n`);
console.log(await Deno.readTextFile(pkgJsonPath));
console.log(`Ready. Next step (manual): cd ${outDir} && npm publish`);
