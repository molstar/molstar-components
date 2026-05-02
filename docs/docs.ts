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

// Advanced demo: 1OG5 assembly with two ligands, ellipsoid markers, distance measurement, animation
const ADVANCED_CODE = `const struct = builder
  .download({ url: 'https://wwwdev.ebi.ac.uk/pdbe/entry-files/download/1og5.bcif' })
  .parse({ format: 'bcif' })
  .assemblyStructure({ assembly_id: '1' });

struct
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' });

struct
  .component({ selector: { label_comp_id: 'HEC' } })
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#ff652d' });

struct
  .component({ selector: { label_comp_id: 'SWF' } })
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#652dff' });

struct
  .primitives({ opacity: 0, ref: 'prim_spheres' })
  .ellipsoid({ center: { label_comp_id: 'HEC' }, color: '#fcb094' })
  .ellipsoid({ center: { label_comp_id: 'SWF' }, color: '#b094fc' });

struct
  .primitives({ opacity: 0, label_opacity: 1, ref: 'prim_distance' })
  .distance({
    start: { label_comp_id: 'HEC' },
    end: { label_comp_id: 'SWF' },
    radius: 0.25,
    color: 'black',
    dash_length: 0.25,
    label_size: 3,
  });

struct.component({ selector: 'ligand' }).focus({ direction: [1, 0, 0] });

builder
  .animation()
  .interpolate({
    kind: 'scalar',
    target_ref: 'prim_spheres',
    property: 'opacity',
    start: 0,
    end: 0.5,
    start_ms: 800,
    duration_ms: 400,
  })
  .interpolate({
    kind: 'scalar',
    target_ref: 'prim_distance',
    property: 'opacity',
    start: 0,
    end: 1,
    start_ms: 1600,
    duration_ms: 400,
  })
  .interpolate({
    kind: 'scalar',
    target_ref: 'prim_distance',
    property: 'label_opacity',
    start: 0,
    end: 1,
    start_ms: 1600,
    duration_ms: 400,
  });`;

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

    // Demo 0 — Advanced Example: 1OG5 with ellipsoids, distance, animation; starts on editor tab
    const demoAdvanced = document.getElementById("demo-advanced");
    if (demoAdvanced) {
      createRoot(demoAdvanced).render(
        createElement(BuilderWithEditorAndViewer, {
          height: "620px",
          autoRun: true,
          hybridMode: true,
          initialCode: ADVANCED_CODE,
          syncOnMount: true,
          diagnosticCodesToIgnore: MULTI_EDITOR_CODES,
        }),
      );
    }

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
