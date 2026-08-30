import type { ComponentSelectorObject, SelectorBuilderMode } from './types.ts';
import { QUICK_SELECTOR_PRESETS } from './presets.ts';

/**
 * Result of parsing a selector value.
 */
export interface ParsedSelector {
  mode: SelectorBuilderMode;
  chainId?: string;
  residueFrom?: number;
  residueTo?: number;
  ligandName?: string;
  ligandChain?: string;
  rawValue?: string;
  unionEntries?: { chain: string; from?: number; to?: number }[];
  expressionValue?: ComponentSelectorObject;
}

/**
 * Parse a selector value to determine its type and extract components.
 * Used to populate the selector builder UI from an existing selector.
 */
export function parseSelector(value: unknown): ParsedSelector {
  // String selector — known quick presets go to quick mode, everything else to raw
  if (typeof value === 'string') {
    const isQuickPreset = QUICK_SELECTOR_PRESETS.some((p) => p.value === value);
    if (isQuickPreset) {
      return { mode: 'quick' };
    }
    return { mode: 'raw', rawValue: value };
  }

  // Array selector → union mode
  if (Array.isArray(value)) {
    const entries = (value as ComponentSelectorObject[]).map((obj) => ({
      chain: obj.label_asym_id ?? '',
      from: obj.beg_label_seq_id ?? obj.label_seq_id,
      to: obj.end_label_seq_id,
    }));
    return { mode: 'union', unionEntries: entries };
  }

  // Object selector
  if (typeof value === 'object' && value !== null) {
    const obj = value as ComponentSelectorObject;

    // Ligand selector (has label_comp_id, no residue fields)
    if (obj.label_comp_id && !obj.beg_label_seq_id && !obj.label_seq_id) {
      return {
        mode: 'ligand',
        ligandName: obj.label_comp_id,
        ligandChain: obj.label_asym_id,
      };
    }

    // Residue range selector
    if (obj.beg_label_seq_id !== undefined || obj.label_seq_id !== undefined) {
      return {
        mode: 'residue',
        chainId: obj.label_asym_id,
        residueFrom: obj.beg_label_seq_id ?? obj.label_seq_id,
        residueTo: obj.end_label_seq_id,
      };
    }

    // Chain selector (only label_asym_id, no other fields)
    if (obj.label_asym_id && Object.keys(obj).length === 1) {
      return {
        mode: 'chain',
        chainId: obj.label_asym_id,
      };
    }

    // Any other object with fields → expression mode
    if (Object.keys(obj).length > 0) {
      return { mode: 'expression', expressionValue: obj };
    }
  }

  // Unknown format - fall back to raw
  return {
    mode: 'raw',
    rawValue: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? ''),
  };
}

/**
 * Serialize a selector value to a display string.
 */
export function selectorToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

/**
 * Validate and parse a raw selector string input.
 * Returns the parsed value or null if invalid.
 */
export function parseRawSelectorInput(input: string): { value: unknown; error?: string } {
  const trimmed = input.trim();

  if (!trimmed) {
    return { value: null, error: 'Empty input' };
  }

  // Try JSON parse for objects/arrays
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return { value: JSON.parse(trimmed) };
    } catch {
      return { value: null, error: 'Invalid JSON syntax' };
    }
  }

  // Treat as string literal (preset like 'all', 'polymer', etc.)
  return { value: trimmed };
}

/**
 * Format selector value for compact human-readable display.
 */
export function formatSelectorPreview(selector: unknown): string {
  if (!selector) return 'Click to configure...';
  if (typeof selector === 'string') return selector;
  if (typeof selector === 'object' && !Array.isArray(selector)) {
    const obj = selector as ComponentSelectorObject;
    if (obj.label_asym_id && obj.label_comp_id) {
      return `Chain ${obj.label_asym_id}: ${obj.label_comp_id}`;
    }
    if (obj.label_comp_id) {
      return `Ligand: ${obj.label_comp_id}`;
    }
    if (obj.beg_label_seq_id && obj.end_label_seq_id) {
      return `Chain ${obj.label_asym_id}: ${obj.beg_label_seq_id}-${obj.end_label_seq_id}`;
    }
    if (obj.label_seq_id) {
      return `Chain ${obj.label_asym_id}: ${obj.label_seq_id}`;
    }
    if (obj.label_asym_id) {
      return `Chain ${obj.label_asym_id}`;
    }
    return JSON.stringify(selector);
  }
  if (Array.isArray(selector)) {
    return `Union (${selector.length} selectors)`;
  }
  return String(selector);
}
