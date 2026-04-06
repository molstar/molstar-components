// Entry point for docs demo

// Configure Monaco workers for this demo. The build bundles ts.worker.js and
// editor.worker.js alongside this script, so we can use relative paths here.
// (Library consumers who don't ship workers get no-op blob workers by default.)
(window as any).MonacoEnvironment = {
  getWorkerUrl: function (_moduleId: string, label: string): string {
    if (label === "typescript" || label === "javascript") {
      return "./ts.worker.js";
    }
    return "./editor.worker.js";
  },
};

import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { EditorWithViewer, MolstarViewer, BuilderWithViewer, BuilderWithEditorAndViewer } from "../src/mod.ts";
import { mvsTreeToUINodes, extractCameraFromUINodes } from "../src/state-builder/index.ts";
import type { RawMVSTree } from "../src/state-builder/index.ts";
import { exampleMVSData, defaultCode } from "./demo-data.js";

const DEFAULT_BUILDER_MVS: RawMVSTree = {
  kind: 'root',
  children: [
    {
      kind: 'download',
      params: { url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1opl.bcif' },
      children: [{
        kind: 'parse',
        params: { format: 'bcif' },
        children: [{
          kind: 'structure',
          params: { type: 'model' },
          children: [
            {
              kind: 'transform',
              params: {
                rotation: [-0.6321036327,0.3450463255,0.6938213248,-0.6288677634,-0.7515716885,-0.1991615756,0.4527364948,-0.5622126202,0.6920597055],
                translation: [36.3924122492,118.2516908402,-26.4992054179]
              }
            },
            {
              kind: 'component',
              params: { selector: { label_asym_id: 'A' } },
              children: [
                { kind: 'representation', params: { type: 'cartoon' }, children: [{ kind: 'color', params: { color: '#4577B2' } }] }
              ]
            },
            {
              kind: 'component',
              params: { selector: { label_asym_id: 'C' } },
              children: [{ kind: 'representation', params: { type: 'ball_and_stick' }, children: [{ kind: 'color', params: { color: '#4577B2' } }] }]
            },
            {
              kind: 'component',
              params: { selector: { label_asym_id: 'D' } },
              children: [{
                kind: 'representation', params: { type: 'surface' },
                children: [
                  { kind: 'color', params: {}, custom: { molstar_color_theme_name: 'element-symbol', molstar_color_theme_params: { carbonColor: { name: 'uniform', params: { value: 4552626 } } } } },
                  { kind: 'opacity', params: { opacity: 0.33 } }
                ]
              }, {
                kind: 'representation', params: { type: 'ball_and_stick' },
                children: [{ kind: 'color', params: {}, custom: { molstar_color_theme_name: 'element-symbol', molstar_color_theme_params: { carbonColor: { name: 'uniform', params: { value: 4552626 } } } } }]
              }]
            }
          ]
        }]
      }]
    },
    {
      kind: 'camera',
      params: { position: [79.47, 66.06, 20.82], target: [0.36, 55.32, 21.8], up: [-0.01, 0.01, -1] }
    }
  ]
};

const { nodes: defaultBuilderNodes, camera: defaultBuilderCamera } = extractCameraFromUINodes(
  mvsTreeToUINodes(DEFAULT_BUILDER_MVS)
);

// Initialize when DOM is ready
window.addEventListener("load", async () => {
  try {
    // Render simple viewer using MolstarViewer component
    const viewerContainer = document.getElementById("viewer-container");
    if (viewerContainer) {
      createRoot(viewerContainer).render(
        createElement(MolstarViewer, {
          mvsData: exampleMVSData,
          config: {
            layoutIsExpanded: false,
            layoutShowControls: false,
            layoutShowSequence: false,
            layoutShowLog: false,
            layoutShowLeftPanel: false,
          },
          style: { height: "100%", width: "100%" },
        }),
      );
    }

    // Render EditorWithViewer component
    const editorViewerContainer = document.getElementById(
      "editor-viewer-container",
    );
    if (editorViewerContainer) {
      createRoot(editorViewerContainer).render(
        createElement(EditorWithViewer, {
          initialCode: defaultCode,
          layout: "horizontal",
          editorHeight: "600px",
          viewerHeight: "600px",
          autoRun: true,
          autoRunDelay: 500,
        }),
      );
    }

    // Render BuilderWithViewer component
    const builderViewerMount = document.getElementById("builder-viewer-mount");
    if (builderViewerMount) {
      createRoot(builderViewerMount).render(
        createElement(BuilderWithViewer, {
          height: "600px",
          initialState: { nodes: defaultBuilderNodes, camera: defaultBuilderCamera },
        }),
      );
    }

    // Render BuilderWithEditorAndViewer component
    const builderEditorViewerMount = document.getElementById("builder-editor-viewer-mount");
    if (builderEditorViewerMount) {
      createRoot(builderEditorViewerMount).render(
        createElement(BuilderWithEditorAndViewer, {
          height: "650px",
          autoRun: true,
          builderInitialState: { nodes: defaultBuilderNodes, camera: defaultBuilderCamera },
        }),
      );
    }
  } catch (error) {
    console.error("Error rendering components:", error);
  }
});
