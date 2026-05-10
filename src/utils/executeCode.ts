import { MVSData } from "molstar/lib/extensions/mvs/mvs-data.js";

// AsyncFunction constructor — the standard way to create async functions from
// strings. Equivalent to `new Function` but natively async, avoiding the manual
// `async function _run() { ... } return _run()` wrapper.
// For running arbitrary user-provided code, this (or eval) is the only
// browser-native option. AsyncFunction is preferred over eval because it does
// NOT capture the local scope, reducing accidental variable leakage.
const AsyncFunction = Object.getPrototypeOf(async function () {
}).constructor as new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

/**
 * Executes MVS builder code and returns the resulting MVS data snapshot.
 *
 * The code string receives a `builder` variable in scope (MVSData.createBuilder()).
 * Eight-digit hex colors are normalized to six digits before execution so that
 * VS Code's color picker output (which appends alpha) works correctly.
 *
 * @param code - User-written MVS JavaScript code
 * @param hiddenCode - Optional code prepended before user code (hidden setup)
 * @returns MVS data object ready to pass to MolstarViewer
 */
export async function executeCode(
  code: string,
  hiddenCode?: string,
): Promise<unknown> {
  const processedCode = code.replace(
    /#([0-9A-Fa-f]{6})[0-9A-Fa-f]{2}/g,
    "#$1",
  );
  const fullCode = hiddenCode
    ? `${hiddenCode}\n\n${processedCode}`
    : processedCode;

  const fn = new AsyncFunction("builder", fullCode);
  const builder = MVSData.createBuilder();
  await fn(builder);

  const snapshot = builder.getSnapshot({
    title: "Preview",
    linger_duration_ms: 5000,
    transition_duration_ms: 500,
  });

  return {
    kind: "multiple",
    metadata: {
      title: "Preview",
      timestamp: new Date().toISOString(),
      version: `${MVSData.SupportedVersion}`,
    },
    snapshots: [snapshot],
  };
}
