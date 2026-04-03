// deno-lint-ignore-file no-explicit-any
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, JSX } from "react";
import { MolViewSpec } from "molstar/lib/extensions/mvs/behavior.js";
import { loadMVSData } from "molstar/lib/extensions/mvs/components/formats.js";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { Plugin } from "molstar/lib/mol-plugin-ui/plugin.js";
import { DefaultPluginUISpec } from "molstar/lib/mol-plugin-ui/spec.js";
import { PluginConfig } from "molstar/lib/mol-plugin/config.js";
import { PluginSpec } from "molstar/lib/mol-plugin/spec.js";

/**
 * Configuration options for the Molstar viewer.
 * Controls the layout and visibility of various UI elements.
 */
export interface MolstarViewerConfig {
  /** Whether the layout is expanded */
  layoutIsExpanded?: boolean;
  /** Show control panel */
  layoutShowControls?: boolean;
  /** Show remote state controls */
  layoutShowRemoteState?: boolean;
  /** Show sequence viewer */
  layoutShowSequence?: boolean;
  /** Show log panel */
  layoutShowLog?: boolean;
  /** Show left side panel */
  layoutShowLeftPanel?: boolean;
  /** Show viewport expand button */
  viewportShowExpand?: boolean;
  /** Show selection mode controls */
  viewportShowSelectionMode?: boolean;
  /** Show animation controls */
  viewportShowAnimation?: boolean;
  /** Additional configuration options */
  [key: string]: any;
}

/**
 * Options for loading MVS (Mol* View State) data into the viewer.
 */
export interface MVSLoadOptions {
  /** Whether to append snapshots to existing data instead of replacing */
  appendSnapshots?: boolean;
  /** Whether to preserve the current camera position when loading */
  keepCamera?: boolean;
}

/**
 * Props for the MolstarViewer component.
 */
export interface MolstarViewerProps {
  /**
   * Molstar MVS (Mol* View State) data as JSON object.
   * This data defines the molecular structure and visualization state.
   */
  mvsData: any;

  /**
   * Viewer configuration options.
   * Controls UI elements and viewer behavior.
   * @defaultValue `{ layoutIsExpanded: false, layoutShowControls: false }`
   * @remarks Config is applied once at mount; changes to this prop after mount are ignored.
   * Use the `key` prop to force a full remount if config needs to change.
   */
  config?: MolstarViewerConfig;

  /**
   * MVS loading options.
   * Controls how the MVS data is loaded into the viewer.
   * @defaultValue `{ appendSnapshots: false, keepCamera: false }`
   */
  loadOptions?: MVSLoadOptions;

  /**
   * Custom CSS styles for the viewer container.
   * @defaultValue `{ position: "relative", width: "100%", height: "500px" }`
   */
  style?: CSSProperties;

  /**
   * CSS class name for the viewer container.
   */
  className?: string;

  /**
   * Callback invoked when the viewer is initialized.
   * @param viewer - The initialized Molstar viewer instance
   */
  onViewerInit?: (viewer: any) => void;

  /**
   * Callback invoked when MVS data is successfully loaded.
   * @param viewer - The Molstar viewer instance with loaded data
   */
  onMVSLoaded?: (viewer: any) => void;

  /**
   * Callback invoked when an error occurs during initialization or loading.
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;
}

const defaultConfig: MolstarViewerConfig = {
  layoutIsExpanded: false,
  layoutShowControls: false,
};

const defaultLoadOptions: MVSLoadOptions = {
  appendSnapshots: false,
  keepCamera: false,
};

function buildPluginSpec(config: MolstarViewerConfig) {
  const spec = DefaultPluginUISpec();
  return {
    ...spec,
    behaviors: [...spec.behaviors, PluginSpec.Behavior(MolViewSpec)],
    layout: {
      initial: {
        isExpanded: config.layoutIsExpanded ?? false,
        showControls: config.layoutShowControls ?? false,
      },
    },
    components: {
      ...spec.components,
      disableDragOverlay: true,
      remoteState: (config.layoutShowRemoteState ? "default" : "none") as
        | "default"
        | "none",
      controls: {
        top: config.layoutShowSequence ? undefined : ("none" as const),
        bottom: config.layoutShowLog ? undefined : ("none" as const),
        left: config.layoutShowLeftPanel ? undefined : ("none" as const),
      },
    },
    config: [
      ...(spec.config ?? []),
      [
        PluginConfig.Viewport.ShowExpand,
        config.viewportShowExpand ?? false,
      ],
      [
        PluginConfig.Viewport.ShowSelectionMode,
        config.viewportShowSelectionMode ?? false,
      ],
      [
        PluginConfig.Viewport.ShowAnimation,
        config.viewportShowAnimation ?? false,
      ],
    ] as any,
  };
}

/**
 * MolstarViewer component for displaying molecular structures.
 *
 * This component integrates the Molstar viewer library to display molecular
 * structures from MVS (Mol* View State) data. It handles viewer initialization,
 * loading molecular data, and provides callbacks for key lifecycle events.
 *
 * Uses a bundled PluginUIContext directly (no CDN loading), avoiding the
 * dual-instance reference-equality issues that break PluginStateObject.is().
 *
 * @example
 * ```tsx
 * import { MolstarViewer } from "@molstar/molstar-components";
 *
 * function App() {
 *   const mvsData = {
 *     // Your MVS data here
 *   };
 *
 *   return (
 *     <MolstarViewer
 *       mvsData={mvsData}
 *       config={{ layoutShowControls: true }}
 *       onViewerInit={(viewer) => console.log("Viewer ready")}
 *       style={{ height: "600px" }}
 *     />
 *   );
 * }
 * ```
 *
 * @param props - Component props
 * @returns A React component displaying the Molstar viewer
 */
export function MolstarViewer({
  mvsData,
  config = {},
  loadOptions = {},
  style = {},
  className = "",
  onViewerInit,
  onMVSLoaded,
  onError,
}: MolstarViewerProps): JSX.Element {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const defaultStyle: CSSProperties = {
    width: "100%",
    height: "500px",
    ...style,
    position: "relative", // always last — not overridable by style prop
  };

  const mergedConfig = useMemo(
    () => ({ ...defaultConfig, ...config }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(config)],
  );
  const mergedLoadOptions = useMemo(
    () => ({ ...defaultLoadOptions, ...loadOptions }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(loadOptions)],
  );

  // Create plugin once (lazy init before hooks)
  const pluginRef = useRef<PluginUIContext | null>(null);
  if (!pluginRef.current) {
    pluginRef.current = new PluginUIContext(buildPluginSpec(mergedConfig));
  }

  // Helper function to load MVS data
  const loadMVSDataHelper = async (plugin: PluginUIContext) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const mvsString = JSON.stringify(mvsData);
      await loadMVSData(plugin, mvsString, "mvsj", mergedLoadOptions);
      if (onMVSLoaded) onMVSLoaded({ plugin });
    } catch (error) {
      if (onError) onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize plugin once on mount
  useEffect(() => {
    const plugin = pluginRef.current!;
    let cancelled = false;

    (async () => {
      await plugin.init();
      if (cancelled) return;
      // canvas3dInitialized resolves after ViewportCanvas.componentDidMount
      // calls plugin.mountAsync() internally — no explicit initContainerAsync() needed
      await plugin.canvas3dInitialized;
      if (cancelled) return;

      setIsInitialized(true);
      if (onViewerInit) onViewerInit({ plugin });

      if (mvsData) {
        // Extra tick: canvas3dInitialized resolves when WebGL context is created,
        // but the first frame may not have been painted yet. This yields to the
        // event loop so ViewportCanvas finishes its initial paint before we load data.
        await new Promise<void>((r) => setTimeout(r, 0));
        await loadMVSDataHelper(plugin);
      }
    })().catch((err) => {
      if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    });

    return () => {
      cancelled = true;
      plugin.dispose();
      pluginRef.current = null;
      setIsInitialized(false);
    };
  }, []); // run once on mount

  // Load MVS data when it changes
  useEffect(() => {
    if (!isInitialized || !pluginRef.current || !mvsData) return;
    loadMVSDataHelper(pluginRef.current);
  }, [mvsData, isInitialized]);

  return (
    <div className={className} style={defaultStyle}>
      {pluginRef.current && <Plugin plugin={pluginRef.current} />}
      {!isInitialized && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
          }}
        >
          Initializing viewer...
        </div>
      )}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          Loading structure...
        </div>
      )}
    </div>
  );
}

export default MolstarViewer;
