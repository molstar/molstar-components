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
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import {
  evaluateCodeToMVSTree,
  mvsTreeToUINodes,
  extractCameraFromUINodes,
  extractAnimationFromUINodes,
  assignMissingRefs,
} from "./state-builder/index.ts";

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
  /**
   * Extra variables injected into scope during "Sync to Builder".
   * Use to provide math utilities present in generated code (Vec3, Mat3, etc.)
   * so the evaluator doesn't throw ReferenceErrors.
   * @example
   * import { Vec3, Mat3 } from 'molstar/lib/mol-math/linear-algebra';
   * <BuilderWithEditorAndViewer extraScope={{ Vec3, Mat3 }} />
   */
  extraScope?: Record<string, unknown>;
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
  extraScope,
}: BuilderWithEditorAndViewerProps): JSX.Element {
  const builderRef = useRef<UIBuilderHandle>(null);
  const latestCodeRef = useRef<string>(initialCode ?? "");
  const [activePanel, setActivePanel] = useState<"builder" | "editor">(
    "builder",
  );
  const [editorValue, setEditorValue] = useState<string | undefined>(undefined);
  const [mvsData, setMvsData] = useState<any>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [plugin, setPlugin] = useState<PluginUIContext | null>(null);
  const [cameraSnapshot, setCameraSnapshot] = useState<unknown>(null);
  const cameraSubRef = useRef<{ unsubscribe(): void } | null>(null);
  const lastCameraUpdateRef = useRef<number>(0);

  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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

  useEffect(() => () => {
    cameraSubRef.current?.unsubscribe();
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
      latestCodeRef.current = code;
      setEditorValue(code);
      scheduleRun(code);
    },
    [scheduleRun],
  );

  const handleEditorChange = useCallback(
    (code: string) => {
      latestCodeRef.current = code;
      scheduleRun(code);
    },
    [scheduleRun],
  );

  const handleViewerInit = useCallback((viewer: any) => {
    const pluginCtx = viewer.plugin as PluginUIContext;
    setPlugin(pluginCtx);
    const sub = pluginCtx.canvas3d?.didDraw.subscribe(() => {
      const now = Date.now();
      if (now - lastCameraUpdateRef.current < 500) return;
      lastCameraUpdateRef.current = now;
      setCameraSnapshot(pluginCtx.canvas3d?.camera.getSnapshot() ?? null);
    });
    cameraSubRef.current = sub ?? null;
  }, []);

  const handleSyncToBuilder = useCallback(async () => {
    setSyncError(null);
    setIsSyncing(true);
    try {
      const tree = await evaluateCodeToMVSTree(latestCodeRef.current, { extraScope });
      if (!tree) {
        setSyncError(
          "Could not parse code. Make sure it uses the builder API (builder.download(...).parse(...) etc.) and has no unresolvable references.",
        );
        return;
      }
      const uiNodes = mvsTreeToUINodes(tree);
      const { nodes: noCamera, camera } = extractCameraFromUINodes(uiNodes);
      const { nodes, animation } = extractAnimationFromUINodes(noCamera);
      const withRefs = assignMissingRefs(nodes, []);
      builderRef.current?.setState({ nodes: withRefs, camera, animation });
      setActivePanel("builder");
      setSyncDialogOpen(false);
    } finally {
      setIsSyncing(false);
    }
  }, [extraScope]);

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
          {activePanel === "editor" && (
            <button
              type="button"
              onClick={() => { setSyncError(null); setSyncDialogOpen(true); }}
              style={{
                marginLeft: "auto",
                padding: "4px 10px",
                border: "none",
                background: "transparent",
                color: "#aaa",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "sans-serif",
                borderLeft: "1px solid #555",
                flexShrink: 0,
              }}
              title="Interpret code and populate the Visual Builder"
            >
              → Sync to Builder
            </button>
          )}
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
            plugin={plugin}
            cameraSnapshot={cameraSnapshot}
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
              onViewerInit={handleViewerInit}
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

      {/* Sync to Builder confirmation dialog */}
      {syncDialogOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => { if (!isSyncing) { setSyncDialogOpen(false); setSyncError(null); } }}
        >
          <div
            style={{
              background: "#2d2d2d",
              border: "1px solid #555",
              borderRadius: 8,
              padding: 24,
              maxWidth: 420,
              width: "90%",
              color: "#ccc",
              fontFamily: "sans-serif",
              fontSize: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: "#eee" }}>
              Sync Code to Builder?
            </div>
            <p style={{ marginBottom: 10, lineHeight: 1.5 }}>
              This will overwrite the Visual Builder state by running your code with the MVS builder.
            </p>
            <p style={{ marginBottom: 16, lineHeight: 1.5, color: "#f0a04b" }}>
              ⚠ If you later generate code from the builder, it will be reformatted by the
              compiler and may differ from your original code.
            </p>
            {syncError && (
              <p style={{ marginBottom: 16, color: "#ff6b6b", fontSize: 13 }}>{syncError}</p>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={isSyncing}
                onClick={() => { setSyncDialogOpen(false); setSyncError(null); }}
                style={{
                  padding: "6px 14px",
                  border: "1px solid #555",
                  borderRadius: 4,
                  background: "transparent",
                  color: "#ccc",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSyncToBuilder}
                style={{
                  padding: "6px 14px",
                  border: "none",
                  borderRadius: 4,
                  background: isSyncing ? "#666" : "#0ea5e9",
                  color: "#fff",
                  cursor: isSyncing ? "not-allowed" : "pointer",
                  fontSize: 13,
                }}
              >
                {isSyncing ? "Syncing…" : "Sync to Builder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
