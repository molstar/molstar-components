// deno-lint-ignore-file no-explicit-any
import { h } from "preact";
import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { MVSTypes, setupMonacoCodeCompletion } from "@molstar/mol-view-stories";
import * as monaco from "monaco-editor";
import * as typescript from "monaco-editor/typescript";

// Import language contributions directly
import {
  conf,
  language,
} from "npm:monaco-editor@0.52.2/esm/vs/basic-languages/javascript/javascript.js";

/**
 * Props for the MolViewEditor component.
 */
export interface MolViewEditorProps {
  /**
   * Initial code to display in the editor.
   * @defaultValue Default MVS structure builder code
   */
  initialCode?: string;
  /**
   * Callback invoked when the editor content changes.
   * @param code - The current code in the editor
   */
  onCodeChange?: (code: string) => void;
  /**
   * Callback invoked when the user saves (Ctrl/Cmd+S).
   * @param code - The code to be saved
   */
  onSave?: (code: string) => void;
  /**
   * Height of the editor container.
   * @defaultValue "400px"
   */
  height?: string;
}

const DEFAULT_CODE = `const structure = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();

structure
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: 'green' });`;

/**
 * MolViewEditor component for editing Mol* View Stories code.
 *
 * This component provides a Monaco-based code editor with syntax highlighting,
 * autocompletion for MVS (Mol* View Stories) types, and keyboard shortcuts.
 * It integrates with the @molstar/mol-view-stories library to provide
 * intelligent code completion for building molecular visualizations.
 *
 * The component expects the Monaco editor to be loaded from a CDN and available
 * on the global window object.
 *
 * @example
 * ```tsx
 * import { MolViewEditor } from "@zachcp/molstar-components";
 *
 * function App() {
 *   const handleSave = (code: string) => {
 *     console.log("Saved code:", code);
 *   };
 *
 *   return (
 *     <MolViewEditor
 *       initialCode="// Your MVS code here"
 *       onSave={handleSave}
 *       height="500px"
 *     />
 *   );
 * }
 * ```
 *
 * @remarks
 * - Press Ctrl/Cmd+S to trigger the save callback
 * - The editor features dark theme, line numbers, and word wrap
 * - Autocompletion for MVS types is automatically configured
 *
 * @param props - Component props
 * @returns A Preact component displaying the Monaco code editor
 */
export function MolViewEditor({
  initialCode = DEFAULT_CODE,
  onCodeChange,
  onSave,
  height = "400px",
}: MolViewEditorProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  // Configure Monaco environment ONCE at module level before first editor creation
  useEffect(() => {
    // Register JavaScript language manually
    try {
      monaco.languages.register({ id: "javascript" });
      monaco.languages.setMonarchTokensProvider("javascript", language as any);
      monaco.languages.setLanguageConfiguration("javascript", conf as any);
      console.log("Registered JavaScript language");
    } catch (e) {
      console.log("JavaScript language already registered or error:", e);
    }

    // Configure Monaco environment to use bundled workers
    if (!(window as any).MonacoEnvironment) {
      (window as any).MonacoEnvironment = {
        getWorkerUrl: function (_moduleId: string, label: string) {
          console.log("Monaco requesting worker:", label);
          if (label === "typescript" || label === "javascript") {
            return "./ts.worker.js";
          }
          return "./editor.worker.js";
        },
      };
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Handler to prevent Cmd+S from triggering browser save or other actions
    // Only fires when the editor container has focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        // Check if the event target is within the editor container
        if (
          containerRef.current &&
          containerRef.current.contains(e.target as Node)
        ) {
          e.preventDefault();
          e.stopPropagation();
          if (onSave && editorRef.current) {
            onSave(editorRef.current.getValue());
          }
        }
      }
    };

    // Initialize Monaco editor
    const initEditor = () => {
      // Configure JavaScript compiler options for better diagnostics
      // Use javascriptDefaults (not typescriptDefaults) for JS language mode
      typescript.javascriptDefaults.setCompilerOptions({
        target: typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: typescript.ModuleResolutionKind.NodeJs,
        module: typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        disableSizeLimit: true,
        noErrorTruncation: true,
        jsx: typescript.JsxEmit.None,
        allowJs: true,
        checkJs: true,
        strict: false,
        noImplicitAny: false,
        strictNullChecks: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        skipLibCheck: true,
        typeRoots: [],
        lib: ["es2020"],
      });

      // Enable diagnostics
      typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: false,
        diagnosticCodesToIgnore: [],
      });

      // Enable eager model sync for immediate validation
      typescript.javascriptDefaults.setEagerModelSync(true);

      // Create Monaco editor model with explicit JavaScript language
      const model = monaco.editor.createModel(
        initialCode,
        "javascript",
        monaco.Uri.parse("file:///main.js"),
      );

      console.log("Created model with language:", model.getLanguageId());
      console.log(
        "Available languages:",
        monaco.languages.getLanguages().map((l: any) => l.id),
      );

      // Create Monaco editor
      const editor = monaco.editor.create(containerRef.current!, {
        model: model,
        theme: "vs-dark",
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        glyphMargin: true,
        folding: true,
        renderValidationDecorations: "on",
        showUnused: true,
        fixedOverflowWidgets: true,
      });

      editorRef.current = editor;

      // Setup Monaco code completion with MVS types
      // Monaco 0.52.2 has typescript language service in monaco.languages.typescript
      console.log("Setting up Monaco code completion with MVS types...");
      console.log("MVSTypes length:", MVSTypes?.length);
      setupMonacoCodeCompletion(monaco as any, MVSTypes);

      // Verify extra libs were added
      const extraLibs = typescript.javascriptDefaults.getExtraLibs();
      console.log("Extra libs added:", Object.keys(extraLibs));
      console.log("Monaco code completion setup complete");

      // Force validate the model after a short delay
      setTimeout(() => {
        const model = editor.getModel();
        if (model) {
          console.log("Editor model language:", model.getLanguageId());
          console.log("Triggering validation...");
          // Trigger validation by making a small change and undoing it
          editor.trigger("keyboard", "type", { text: " " });
          editor.trigger("keyboard", "undo", {});
        }
      }, 1000);

      // Add keyboard shortcuts for save
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (onSave) {
          onSave(editor.getValue());
        }
      });

      // Handle content changes
      editor.onDidChangeModelContent(() => {
        if (onCodeChange) {
          onCodeChange(editor.getValue());
        }
      });

      setIsReady(true);
    };

    // Add global event listener
    document.addEventListener("keydown", handleKeyDown, true);

    initEditor();

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [onSave]);

  // Update editor value when initialCode prop changes
  useEffect(() => {
    if (editorRef.current && isReady) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== initialCode) {
        editorRef.current.setValue(initialCode);
      }
    }
  }, [initialCode, isReady]);

  return h("div", {
    ref: containerRef,
    style: { width: "100%", height, border: "1px solid #333" },
  });
}
