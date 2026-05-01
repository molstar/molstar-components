// Entry point for docs feature overview page

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
import { BuilderWithEditorAndViewer } from "../src/mod.ts";
import { mvsTreeToUINodes, extractCameraFromUINodes } from "../src/state-builder/index.ts";
import type { RawMVSTree } from "../src/state-builder/index.ts";

// Structure used for the State Builder demo (1opl — has polymer, ligand, and surface components)
const DEMO_BUILDER_MVS: RawMVSTree = {
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
                rotation: [-0.9238795325112866, -1.1314261122877003e-16, 0.38268343236508995, -0.3262912646673585, 0.5224985647159488, -0.7877367964438053, -0.19995154415133226, -0.8526401643540923, -0.48272572970758904],
              },
            },
            {
              kind: 'component',
              params: { selector: { label_asym_id: 'A' } },
              children: [
                { kind: 'representation', params: { type: 'cartoon' }, children: [{ kind: 'color', params: { color: '#4577B2' } }] },
              ],
            },
            {
              kind: 'component',
              params: { selector: { label_asym_id: 'C' } },
              children: [
                { kind: 'representation', params: { type: 'ball_and_stick' }, children: [{ kind: 'color', params: { color: '#4577B2' } }] },
              ],
            },
            {
              kind: 'component',
              params: { selector: { label_asym_id: 'D' } },
              children: [{
                kind: 'representation',
                params: { type: 'surface' },
                children: [
                  { kind: 'color', params: {}, custom: { molstar_color_theme_name: 'element-symbol', molstar_color_theme_params: { carbonColor: { name: 'uniform', params: { value: 4552626 } } } } },
                  { kind: 'opacity', params: { opacity: 0.33 } },
                ],
              }, {
                kind: 'representation',
                params: { type: 'ball_and_stick' },
                children: [{ kind: 'color', params: {}, custom: { molstar_color_theme_name: 'element-symbol', molstar_color_theme_params: { carbonColor: { name: 'uniform', params: { value: 4552626 } } } } }],
              }],
            },
          ],
        }],
      }],
    },
  ],
};

// Starter code for the hybrid mode demo — has .component() and .color() calls to right-click
const HYBRID_STARTER_CODE = `const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();

structure
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: '#4577B2' });

structure
  .component({ selector: 'ligand' })
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#cc3399' });`;

const { nodes: builderNodes, camera: builderCamera } = extractCameraFromUINodes(
  mvsTreeToUINodes(DEMO_BUILDER_MVS),
);

window.addEventListener("load", async () => {
  try {
    // Multiple editors share one Monaco TS service — suppress cross-editor
    // "cannot redeclare block-scoped variable" false positives (code 2451).
    const MULTI_EDITOR_CODES = [2451];

    // Demo 1 — State Builder: preloaded structure, builder tab
    const demoBuilder = document.getElementById("demo-builder");
    if (demoBuilder) {
      createRoot(demoBuilder).render(
        createElement(BuilderWithEditorAndViewer, {
          height: "580px",
          autoRun: true,
          hybridMode: true,
          builderInitialState: { nodes: builderNodes, camera: builderCamera },
          diagnosticCodesToIgnore: MULTI_EDITOR_CODES,
        }),
      );
    }

    // Demo 2 — Setup Wizard: no initial state, wizard appears immediately
    const demoWizard = document.getElementById("demo-wizard");
    if (demoWizard) {
      createRoot(demoWizard).render(
        createElement(BuilderWithEditorAndViewer, {
          height: "580px",
          autoRun: true,
          diagnosticCodesToIgnore: MULTI_EDITOR_CODES,
        }),
      );
    }

    // Demo 3 — Hybrid Mode: pre-filled code, editor tab default, no sync button
    const demoHybrid = document.getElementById("demo-hybrid");
    if (demoHybrid) {
      createRoot(demoHybrid).render(
        createElement(BuilderWithEditorAndViewer, {
          height: "580px",
          autoRun: true,
          hybridMode: true,
          initialCode: HYBRID_STARTER_CODE,
          initialPanel: "editor",
          hideSyncButton: true,
          diagnosticCodesToIgnore: MULTI_EDITOR_CODES,
        }),
      );
    }

    // Demo 4 — Bidirectional Sync: pre-filled code but starts on empty builder tab
    const demoSync = document.getElementById("demo-sync");
    if (demoSync) {
      createRoot(demoSync).render(
        createElement(BuilderWithEditorAndViewer, {
          height: "580px",
          autoRun: true,
          hybridMode: true,
          initialCode: HYBRID_STARTER_CODE,
          diagnosticCodesToIgnore: MULTI_EDITOR_CODES,
        }),
      );
    }
  } catch (error) {
    console.error("Error rendering docs demos:", error);
  }
});
