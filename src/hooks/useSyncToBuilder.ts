import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { UIBuilderHandle } from "../state-builder-ui/provider.tsx";
import {
  assignMissingRefs,
  evaluateCodeToMVSTree,
  extractAnimationFromUINodes,
  extractCameraFromUINodes,
  mvsTreeToUINodes,
} from "../state-builder/index.ts";
import type { EvaluateCodeOptions } from "../state-builder/index.ts";

export interface UseSyncToBuilderOptions {
  /**
   * Extra variables injected into scope when evaluating the code.
   * Use to provide math utilities (Vec3, Mat3, etc.) that appear in
   * generated code so the evaluator doesn't throw ReferenceErrors.
   */
  extraScope?: EvaluateCodeOptions["extraScope"];
  /**
   * Story-level JavaScript prepended to the scene code before evaluation.
   * Use this when the scene code calls helper functions defined at the story
   * level (e.g. `structure()`, `polymer()`, `Colors`) so the evaluator can
   * resolve them.
   */
  commonCode?: string;
}

export interface UseSyncToBuilderResult {
  /**
   * Evaluate `code` as MVS builder JavaScript and push the resulting
   * node tree into the builder. Returns `true` on success, `false` on
   * failure (check `error` for the reason).
   */
  sync: (code: string) => Promise<boolean>;
  /** True while a sync is in progress. */
  isSyncing: boolean;
  /** Error message from the last failed sync, or `null`. */
  error: string | null;
  /** Clear the error state (e.g. when the user dismisses a dialog). */
  clearError: () => void;
}

/**
 * Evaluates JavaScript MVS builder code and syncs the result into a
 * `UIBuilderHandle` (from `UIBuilderProvider` or `MolViewStateBuilder`).
 *
 * Encapsulates the full evaluate → convert → setState pipeline so the
 * calling component only needs to handle confirmation UI and error display.
 *
 * @example
 * ```tsx
 * const builderRef = useRef<UIBuilderHandle>(null);
 * const { sync, isSyncing, error, clearError } = useSyncToBuilder(builderRef);
 *
 * // inside your JSX:
 * <button disabled={isSyncing} onClick={() => sync(currentCode)}>
 *   {isSyncing ? 'Syncing…' : 'Sync to Builder'}
 * </button>
 * {error && <p>{error}</p>}
 * ```
 *
 * @param builderRef - Ref to the `UIBuilderHandle` exposed by `UIBuilderProvider`
 *   or `MolViewStateBuilder`.
 * @param options - Optional `extraScope` passed to the code evaluator.
 */
export function useSyncToBuilder(
  builderRef: RefObject<UIBuilderHandle | null>,
  options?: UseSyncToBuilderOptions,
): UseSyncToBuilderResult {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep options in refs so the sync callback stays stable even when
  // the caller passes new object references on every render.
  const extraScopeRef = useRef(options?.extraScope);
  useEffect(() => {
    extraScopeRef.current = options?.extraScope;
  }, [options?.extraScope]);
  const commonCodeRef = useRef(options?.commonCode);
  useEffect(() => {
    commonCodeRef.current = options?.commonCode;
  }, [options?.commonCode]);

  const sync = useCallback(async (code: string): Promise<boolean> => {
    setError(null);
    setIsSyncing(true);
    try {
      const fullCode = commonCodeRef.current
        ? `${commonCodeRef.current}\n${code}`
        : code;
      const tree = await evaluateCodeToMVSTree(fullCode, {
        extraScope: extraScopeRef.current,
      });
      if (!tree) {
        setError(
          "Could not parse code. Make sure it uses the builder API " +
            "(builder.download(...).parse(...) etc.) and contains no " +
            "unresolvable references.",
        );
        return false;
      }
      const uiNodes = mvsTreeToUINodes(tree);
      const { nodes: noCamera, camera } = extractCameraFromUINodes(uiNodes);
      const { nodes, animation } = extractAnimationFromUINodes(noCamera);
      const withRefs = assignMissingRefs(nodes, []);
      builderRef.current?.setState({ nodes: withRefs, camera, animation });
      return true;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unexpected error during sync",
      );
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [builderRef]);

  const clearError = useCallback(() => setError(null), []);

  return { sync, isSyncing, error, clearError };
}
