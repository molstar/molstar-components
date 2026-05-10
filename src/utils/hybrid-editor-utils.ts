// src/utils/hybrid-editor-utils.ts

import * as monaco from 'monaco-editor';
import { ParamFormatter } from '../state-builder/compiler/codegen/formatters.ts';

/**
 * Builder methods that have visual helpers, mapped to UINode kind.
 * Only these methods appear in the context menu.
 */
export const HYBRID_HELPER_METHODS: Record<string, string> = {
  component:  'component',
  color:      'color',
  transform:  'transform',
  camera:     'camera',
};

export interface MethodContext {
  /** Builder method name, e.g. 'component' */
  methodName: string;
  /**
   * Range of the params content between `(` and `)`.
   * This is the region that `injectNodeParams` will replace.
   */
  paramsRange: monaco.Range;
  /** Raw text of the params as it appears in the editor. */
  paramsText: string;
}

/**
 * Scan backward from `position` (up to 20 lines) to find the nearest
 * helper-eligible builder method call that encloses the cursor.
 *
 * Returns `null` when the cursor is not inside a recognized method call.
 */
export function detectMethodAtCursor(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
): MethodContext | null {
  const methodPattern = /\.(\w+)\s*\(/g;

  for (let lineNum = position.lineNumber; lineNum >= Math.max(1, position.lineNumber - 20); lineNum--) {
    const lineText = model.getLineContent(lineNum);
    methodPattern.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = methodPattern.exec(lineText)) !== null) {
      const methodName = match[1];
      if (!(methodName in HYBRID_HELPER_METHODS)) continue;

      // Column (1-based) of the character immediately after the opening `(`
      const openParenCol = match.index + match[0].length + 1; // +1 for 1-based

      const paramsRange = findParamsRange(model, lineNum, openParenCol);
      if (!paramsRange) continue;

      // Check cursor is inside this call's range
      const callStart = new monaco.Position(lineNum, match.index + 1);
      const callEnd = new monaco.Position(paramsRange.endLineNumber, paramsRange.endColumn + 1);
      if (position.isBefore(callStart) || callEnd.isBefore(position)) continue;

      const paramsText = model.getValueInRange(paramsRange).trim();
      return { methodName, paramsRange, paramsText };
    }
  }

  return null;
}

/**
 * Starting from column `startCol` (1-based) on `startLine`, count brackets
 * to find the matching `)` and return the Range of the content between them.
 * Looks up to 30 lines ahead.
 */
function findParamsRange(
  model: monaco.editor.ITextModel,
  startLine: number,
  startCol: number,
): monaco.Range | null {
  let depth = 1;
  const totalLines = model.getLineCount();

  for (let lineNum = startLine; lineNum <= Math.min(totalLines, startLine + 30); lineNum++) {
    const lineText = model.getLineContent(lineNum);
    // Start scanning from startCol (convert to 0-based) on first line, otherwise from 0
    const startOffset = lineNum === startLine ? startCol - 1 : 0;

    for (let col = startOffset; col < lineText.length; col++) {
      const ch = lineText[col];
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') {
        depth--;
        if (depth === 0) {
          // Range from startLine:startCol to lineNum:col (1-based, exclusive of parens)
          return new monaco.Range(startLine, startCol, lineNum, col + 1);
        }
      }
    }
  }

  return null;
}

/**
 * Parse a JavaScript object literal or primitive text into a plain object.
 *
 * Uses `Function` evaluation — safe here since the text is the user's own code.
 * Falls back to `{}` on parse errors so the helper opens with defaults.
 */
export function parseParamsText(text: string): Record<string, unknown> {
  if (!text || text === '{}') return {};
  try {
    const result = new Function(`return (${text})`)();
    if (result !== null && typeof result === 'object' && !Array.isArray(result)) {
      return result as Record<string, unknown>;
    }
  } catch {
    // Ignore — return empty so helper opens with defaults
  }
  return {};
}

/**
 * Replace the params range in the editor with the formatted result.
 *
 * `params` is the updated params object from the helper's `onUpdate` callback.
 * Formatting uses `ParamFormatter.formatObject` to match code generator style.
 */
export function injectNodeParams(
  editor: monaco.editor.IStandaloneCodeEditor,
  paramsRange: monaco.Range,
  params: Record<string, unknown>,
): void {
  const formatted = ParamFormatter.formatObject(params, 0);
  editor.executeEdits('hybrid-helper', [
    {
      range: paramsRange,
      text: formatted,
      forceMoveMarkers: true,
    },
  ]);
}
