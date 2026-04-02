// deno-lint-ignore-file no-explicit-any
import { useRef, useState, useCallback, useEffect } from "react";
import type { JSX } from "react";
import { MolViewStateBuilder } from "./MolViewStateBuilder.tsx";
import { MolstarViewer } from "./MolstarViewer.tsx";
import { executeCode } from "./utils/executeCode.ts";
import type { UIBuilderHandle, UIBuilderSnapshot } from "./MolViewStateBuilder.tsx";
import type { MolstarViewerConfig } from "./MolstarViewer.tsx";

/**
 * Props for BuilderWithViewer.
 */
export interface BuilderWithViewerProps {
  /**
   * Height of the entire component.
   * @defaultValue "600px"
   */
  height?: string;
  /**
   * When true, clicking "Generate Code" in the builder immediately executes
   * the code and updates the viewer.
   * @defaultValue true
   */
  autoRun?: boolean;
  /**
   * Debounce delay in ms between code generation and viewer update.
   * @defaultValue 300
   */
  autoRunDelay?: number;
  /**
   * Molstar viewer layout/UI configuration.
   */
  viewerConfig?: MolstarViewerConfig;
  /**
   * Called with the generated code when the builder generates code.
   */
  onCodeGenerated?: (code: string) => void;
  /**
   * Initial state for the visual builder (nodes, constants, camera, animation).
   */
  initialState?: Partial<UIBuilderSnapshot>;
}

const MINIMAL_VIEWER_CONFIG: MolstarViewerConfig = {
  layoutIsExpanded: false,
  layoutShowControls: false,
  layoutShowSequence: false,
  layoutShowLog: false,
  layoutShowLeftPanel: false,
  viewportShowExpand: false,
  viewportShowSelectionMode: false,
  viewportShowAnimation: false,
};

/**
 * BuilderWithViewer — visual builder on the left, Molstar viewer on the right.
 *
 * When the builder generates code via "Generate Code", the code is executed
 * and the resulting MVS data is loaded into the viewer. No editor panel.
 *
 * Note: The viewer uses the CDN-polling approach until Phase 2.
 *
 * @example
 * ```tsx
 * <BuilderWithViewer height="600px" builderWidth="380px" />
 * ```
 */
export function BuilderWithViewer({
  height = "600px",
  autoRun = true,
  autoRunDelay = 300,
  viewerConfig,
  onCodeGenerated,
  initialState,
}: BuilderWithViewerProps): JSX.Element {
  const builderRef = useRef<UIBuilderHandle>(null);
  const [mvsData, setMvsData] = useState<any>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runCode = useCallback(async (code: string) => {
    try {
      setRunError(null);
      const result = await executeCode(code);
      setMvsData(result);
    } catch (err: any) {
      setRunError(err?.message ?? "Error executing code");
    }
  }, []);

  const handleCodeGenerated = useCallback(
    (code: string) => {
      onCodeGenerated?.(code);
      if (!autoRun) return;
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runCode(code), autoRunDelay);
    },
    [autoRun, autoRunDelay, runCode, onCodeGenerated],
  );

  useEffect(() => () => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
  }, []);

  const config = viewerConfig ?? MINIMAL_VIEWER_CONFIG;

  return (
    <div style={{ display: "flex", height, gap: "4px", overflow: "hidden" }}>
      {/* Builder panel */}
      <div style={{ flex: 1, flexBasis: 0, minWidth: 240, height: "100%", overflow: "hidden" }}>
        <MolViewStateBuilder
          ref={builderRef}
          height="100%"
          onCodeGenerated={handleCodeGenerated}
          initialState={initialState}
          autoGenerateOnMount={!!initialState?.nodes?.length}
        />
      </div>

      {/* Viewer panel */}
      <div style={{ flex: 1, flexBasis: 0, minWidth: 200, height: "100%", display: "flex", flexDirection: "column" }}>
        {mvsData
          ? (
            <MolstarViewer
              mvsData={mvsData}
              config={config}
              style={{ width: "100%", flex: 1 }}
            />
          )
          : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #333",
                color: "#555",
                backgroundColor: "#1e1e1e",
                fontSize: 13,
                fontFamily: "sans-serif",
              }}
            >
              Generate code to preview
            </div>
          )}
        {runError && (
          <div
            style={{
              padding: "4px 8px",
              backgroundColor: "#2d1b1b",
              color: "#ff6b6b",
              fontSize: 11,
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {runError}
          </div>
        )}
      </div>
    </div>
  );
}
