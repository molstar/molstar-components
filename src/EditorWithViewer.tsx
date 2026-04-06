// deno-lint-ignore-file no-explicit-any
import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { MolViewEditor } from "./MolViewEditor.tsx";
import { MolstarViewer } from "./MolstarViewer.tsx";
import { executeCode as executeMVSCode } from "./utils/executeCode.ts";
import type * as monaco from "monaco-editor";

/**
 * Log entry for execution history.
 */
export interface LogEntry {
  timestamp: Date;
  level: "info" | "error" | "success";
  message: string;
}

/**
 * Props for the EditorWithViewer component.
 */
export interface EditorWithViewerProps {
  /**
   * Initial code to display in the editor.
   * @defaultValue Empty string
   */
  initialCode?: string;
  /**
   * Layout orientation for the editor and viewer.
   * - "horizontal": Editor and viewer side-by-side
   * - "vertical": Editor above viewer
   * @defaultValue "horizontal"
   */
  layout?: "horizontal" | "vertical";
  /**
   * Height of the editor panel.
   * @defaultValue "600px"
   */
  editorHeight?: string;
  /**
   * Height of the viewer panel.
   * @defaultValue "600px"
   */
  viewerHeight?: string;
  /**
   * Whether to automatically execute code as the user types.
   * When enabled, code execution is debounced based on `autoRunDelay`.
   * @defaultValue true
   */
  autoRun?: boolean;
  /**
   * Delay in milliseconds before auto-executing code after the user stops typing.
   * Only applies when `autoRun` is true.
   * @defaultValue 500
   */
  autoRunDelay?: number;
  /**
   * Hidden JavaScript code that is always prepended to the user's code.
   * Useful for setting up global variables or functions.
   * @defaultValue Empty string
   */
  hiddenCode?: string;
  /**
   * Show the execution log panel below the editor.
   * @defaultValue true
   */
  showLog?: boolean;
  /**
   * Show the auto-update toggle checkbox.
   * @defaultValue true
   */
  showAutoUpdateToggle?: boolean;
  /**
   * Show the bottom control panel (auto-update toggle, log toggle, etc.).
   * When false, hides all controls for a minimalistic interface.
   * @defaultValue true
   */
  showBottomControlPanel?: boolean;
  /**
   * Additional Monaco editor options to customize editor behavior.
   * These options are passed through to the MolViewEditor component.
   * @defaultValue undefined
   */
  editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
  /** Enable Monaco hybrid mode — right-click helper dialogs on builder methods. */
  hybridMode?: boolean;
}

/**
 * EditorWithViewer component combining a code editor and molecular viewer.
 *
 * This component provides an integrated development environment for creating
 * molecular visualizations using Mol* View Stories. It combines the MolViewEditor
 * for code editing with the MolstarViewer for real-time visualization.
 *
 * Features:
 * - Side-by-side or stacked layout
 * - Live code execution (auto-run mode) or manual execution (Ctrl/Cmd+S)
 * - Error display for debugging
 * - Hidden code execution for setup/utility functions
 * - Debounced auto-execution to reduce unnecessary renders
 *
 * @param props - Component props
 * @returns A React component with integrated editor and viewer
 */
export function EditorWithViewer({
  initialCode,
  layout = "horizontal",
  editorHeight = "600px",
  viewerHeight = "600px",
  autoRun = true,
  autoRunDelay = 500,
  hiddenCode = "",
  showLog = true,
  showAutoUpdateToggle = true,
  showBottomControlPanel = true,
  editorOptions,
  hybridMode,
}: EditorWithViewerProps): JSX.Element {
  const [mvsData, setMvsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState(initialCode || "");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(autoRun);
  const [logExpanded, setLogExpanded] = useState(false);
  const [showLogPanel, setShowLogPanel] = useState(showLog);
  const debounceTimerRef = useRef<number | null>(null);

  const addLog = useCallback(
    (level: "info" | "error" | "success", message: string) => {
      setLogs((prev) => {
        const newLogs = [...prev, { timestamp: new Date(), level, message }];
        // Keep only last 100 entries to prevent memory issues
        return newLogs.slice(-100);
      });
    },
    [],
  );

  const handleExecute = useCallback(
    async (code: string) => {
      const startTime = Date.now();
      try {
        setError(null);
        addLog("info", "Executing MVS code...");
        const result = await executeMVSCode(code, hiddenCode || undefined);
        addLog("success", `Code executed successfully (${Date.now() - startTime}ms)`);
        setMvsData(result);
      } catch (err: unknown) {
        const errorMsg = (err as Error).message || "Error executing code";
        addLog("error", errorMsg);
        setError(errorMsg);
      }
    },
    [hiddenCode, addLog],
  );

  const handleSave = useCallback(
    (code: string) => {
      handleExecute(code);
    },
    [handleExecute],
  );

  const handleCodeChange = useCallback(
    (code: string) => {
      setCurrentCode(code);

      if (autoUpdateEnabled) {
        // Clear existing timer
        if (debounceTimerRef.current !== null) {
          clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
          handleExecute(code);
        }, autoRunDelay) as any;
      }
    },
    [autoUpdateEnabled, autoRunDelay, handleExecute],
  );

  // Execute initial code on mount if autoRun is enabled
  useEffect(() => {
    if (autoRun && initialCode) {
      // Small delay to ensure viewer is ready
      const timer = setTimeout(() => {
        handleExecute(initialCode);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoRun, initialCode, handleExecute]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const containerStyle = {
    display: "flex",
    flexDirection: layout === "horizontal" ? "row" : "column",
    gap: "10px",
    height: layout === "horizontal" ? editorHeight : "auto",
  } as any;

  const editorContainerStyle = {
    flex: layout === "horizontal" ? "1" : "0 0 auto",
    minWidth: layout === "horizontal" ? "400px" : "auto",
  };

  const viewerContainerStyle = {
    flex: layout === "horizontal" ? "1" : "1",
    minWidth: layout === "horizontal" ? "400px" : "auto",
    minHeight: viewerHeight,
  };

  return (
    <div style={containerStyle}>
      <div style={editorContainerStyle}>
        <MolViewEditor
          initialCode={currentCode}
          onCodeChange={handleCodeChange}
          onSave={handleSave}
          height={editorHeight}
          editorOptions={editorOptions}
          hybridMode={hybridMode}
        />
        {showBottomControlPanel && showAutoUpdateToggle && (
          <div
            style={{
              padding: "10px",
              backgroundColor: "#2a2a2a",
              borderTop: "1px solid #333",
              display: "flex",
              gap: "20px",
              alignItems: "center",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <input
                type="checkbox"
                checked={autoUpdateEnabled}
                onChange={(e) =>
                  setAutoUpdateEnabled((e.target as HTMLInputElement).checked)}
                style={{ cursor: "pointer" }}
              />
              <span>Auto-update (runs code automatically after typing)</span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <input
                type="checkbox"
                checked={showLogPanel}
                onChange={(e) =>
                  setShowLogPanel((e.target as HTMLInputElement).checked)}
                style={{ cursor: "pointer" }}
              />
              <span>Show execution log</span>
            </label>
          </div>
        )}
        {showBottomControlPanel && showLog && showLogPanel &&
          logs.length > 0 && (
          <details
            open={logExpanded}
            onToggle={(e) =>
              setLogExpanded((e.target as HTMLDetailsElement).open)}
            style={{
              marginTop: "5px",
              border: "1px solid #333",
              backgroundColor: "#1a1a1a",
            }}
          >
            <summary
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                userSelect: "none",
                fontSize: "14px",
              }}
            >
              {`Execution Log (${logs.length} ${
                logs.length === 1 ? "entry" : "entries"
              }) - Click to ${logExpanded ? "collapse" : "expand"}`}
            </summary>
            <div
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                backgroundColor: "#0a0a0a",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "4px 10px",
                    borderBottom: "1px solid #333",
                    color: log.level === "error"
                      ? "#ff6b6b"
                      : log.level === "success"
                      ? "#51cf66"
                      : "#ccc",
                  }}
                >
                  <span style={{ opacity: 0.6 }}>
                    [{log.timestamp.toLocaleTimeString()}]
                  </span>
                  {" "}
                  {log.message}
                </div>
              ))}
            </div>
          </details>
        )}
        {showBottomControlPanel && error && (
          <div
            style={{
              padding: "10px",
              marginTop: "5px",
              backgroundColor: "#ff000020",
              color: "#ff0000",
              border: "1px solid #ff0000",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
          >
            {`Error: ${error}`}
          </div>
        )}
      </div>
      <div style={viewerContainerStyle}>
        {mvsData
          ? (
            <MolstarViewer
              mvsData={mvsData}
              config={{
                layoutIsExpanded: false,
                layoutShowControls: false,
                layoutShowRemoteState: false,
                layoutShowSequence: false,
                layoutShowLog: false,
                layoutShowLeftPanel: false,
                viewportShowExpand: false,
                viewportShowSelectionMode: false,
                viewportShowAnimation: false,
              }}
              style={{ height: "100%", width: "100%" }}
            />
          )
          : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #333",
                color: "#666",
                backgroundColor: "#1e1e1e",
              }}
            >
              {autoUpdateEnabled
                ? "Start typing to see live updates..."
                : "Press Ctrl/Cmd+S to execute code"}
            </div>
          )}
      </div>
    </div>
  );
}
