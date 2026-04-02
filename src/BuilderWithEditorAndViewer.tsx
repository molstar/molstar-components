// deno-lint-ignore-file no-explicit-any
import { useRef, useState, useCallback, useEffect } from "react";
import type { JSX, CSSProperties } from "react";
import { MolViewStateBuilder } from "./MolViewStateBuilder.tsx";
import { MolViewEditor } from "./MolViewEditor.tsx";
import { MolstarViewer } from "./MolstarViewer.tsx";
import { executeCode } from "./utils/executeCode.ts";
import type { UIBuilderHandle, UIBuilderSnapshot } from "./MolViewStateBuilder.tsx";
import type { MolViewEditorProps } from "./MolViewEditor.tsx";
import type { MolstarViewerConfig } from "./MolstarViewer.tsx";

/**
 * Props for BuilderWithEditorAndViewer.
 */
export interface BuilderWithEditorAndViewerProps {
  /**
   * Height of the entire component.
   * @defaultValue "600px"
   */
  height?: string;
  /**
   * Initial code in the Monaco editor before the builder generates anything.
   */
  initialCode?: string;
  /**
   * Initial state for the visual builder (nodes, constants, camera, animation).
   */
  builderInitialState?: Partial<UIBuilderSnapshot>;
  /**
   * Additional Monaco editor options.
   */
  editorOptions?: MolViewEditorProps["editorOptions"];
  /**
   * When true, executing code in the editor automatically updates the viewer.
   * @defaultValue true
   */
  autoRun?: boolean;
  /**
   * Debounce delay in ms for auto-run after editor content changes.
   * @defaultValue 500
   */
  autoRunDelay?: number;
  /**
   * Molstar viewer layout/UI configuration.
   */
  viewerConfig?: MolstarViewerConfig;
  /**
   * CSS style applied to the outer container.
   */
  style?: CSSProperties;
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

const TAB_BTN: CSSProperties = {
  flex: 1,
  padding: "6px 12px",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "sans-serif",
  color: "#ccc",
  transition: "background 0.1s",
};

/**
 * BuilderWithEditorAndViewer — two-panel layout with tabbed left panel.
 *
 * Left panel: toggle between the visual Builder and the Monaco Code editor
 * (both always mounted to preserve state).
 * Right panel: Molstar viewer, always visible.
 *
 * Data flow: Builder generates code → code appears in editor tab → editor
 * auto-runs → MVS data flows to viewer.
 *
 * @example
 * ```tsx
 * <BuilderWithEditorAndViewer height="700px" autoRun={true} />
 * ```
 */
export function BuilderWithEditorAndViewer({
  height = "600px",
  initialCode,
  builderInitialState,
  editorOptions,
  autoRun = true,
  autoRunDelay = 500,
  viewerConfig,
  style,
}: BuilderWithEditorAndViewerProps): JSX.Element {
  const builderRef = useRef<UIBuilderHandle>(null);
  const [activePanel, setActivePanel] = useState<"builder" | "editor">(
    "builder",
  );
  const [editorValue, setEditorValue] = useState<string | undefined>(undefined);
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

  const scheduleRun = useCallback(
    (code: string) => {
      if (!autoRun) return;
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runCode(code), autoRunDelay);
    },
    [autoRun, autoRunDelay, runCode],
  );

  useEffect(() => () => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
  }, []);

  // Run initialCode on mount when autoRun is enabled
  useEffect(() => {
    if (autoRun && initialCode) {
      runCode(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only once on mount

  const handleCodeGenerated = useCallback(
    (code: string) => {
      setEditorValue(code);
      scheduleRun(code);
    },
    [scheduleRun],
  );

  const handleEditorChange = useCallback(
    (code: string) => {
      scheduleRun(code);
    },
    [scheduleRun],
  );

  const config = viewerConfig ?? MINIMAL_VIEWER_CONFIG;

  return (
    <div
      style={{
        display: "flex",
        height,
        gap: "4px",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Left panel: tabbed builder / editor */}
      <div
        style={{
          flex: 1,
          flexBasis: 0,
          minWidth: 280,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Tab buttons */}
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            borderBottom: "1px solid #333",
            backgroundColor: "#1e1e1e",
          }}
        >
          <button
            type="button"
            onClick={() => setActivePanel("builder")}
            style={{
              ...TAB_BTN,
              background: activePanel === "builder" ? "#3c3c3c" : "transparent",
            }}
          >
            Builder
          </button>
          <button
            type="button"
            onClick={() => setActivePanel("editor")}
            style={{
              ...TAB_BTN,
              background: activePanel === "editor" ? "#3c3c3c" : "transparent",
            }}
          >
            Code
          </button>
        </div>

        {/* Builder — always mounted, hidden when not active */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: activePanel === "builder" ? "flex" : "none",
          }}
        >
          <MolViewStateBuilder
            ref={builderRef}
            height="100%"
            onCodeGenerated={handleCodeGenerated}
            initialState={builderInitialState}
            autoGenerateOnMount={!!builderInitialState?.nodes?.length}
          />
        </div>

        {/* Editor — always mounted, hidden when not active */}
        <div
          style={{
            flex: 1,
            flexDirection: "column",
            display: activePanel === "editor" ? "flex" : "none",
          }}
        >
          <MolViewEditor
            initialCode={initialCode}
            value={editorValue}
            onCodeChange={handleEditorChange}
            height={runError ? "calc(100% - 30px)" : "100%"}
            editorOptions={editorOptions}
          />
          {runError && (
            <div
              style={{
                height: 30,
                padding: "4px 8px",
                backgroundColor: "#2d1b1b",
                color: "#ff6b6b",
                fontSize: 11,
                fontFamily: "monospace",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {runError}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: viewer always visible */}
      <div style={{ flex: 1, flexBasis: 0, minWidth: 200, height: "100%" }}>
        {mvsData
          ? (
            <MolstarViewer
              mvsData={mvsData}
              config={config}
              style={{ width: "100%", height: "100%" }}
            />
          )
          : (
            <div
              style={{
                width: "100%",
                height: "100%",
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
      </div>
    </div>
  );
}
