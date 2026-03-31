// Entry point for docs demo
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { EditorWithViewer, MolstarViewer } from "../src/mod.ts";
import { exampleMVSData, defaultCode } from "./demo-data.js";

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
  } catch (error) {
    console.error("Error rendering components:", error);
  }
});
