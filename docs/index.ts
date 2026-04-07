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
                rotation: [-0.9238795325112866,-1.1314261122877003e-16,0.38268343236508995,-0.3262912646673585,0.5224985647159488,-0.7877367964438053,-0.19995154415133226,-0.8526401643540923,-0.48272572970758904]
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
          hybridMode: true,
        }),
      );
    }
  } catch (error) {
    console.error("Error rendering components:", error);
  }
});
