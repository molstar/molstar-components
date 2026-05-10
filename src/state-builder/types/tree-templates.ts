/**
 * Tree Templates - Predefined MVS Subtrees
 *
 * Provides declarative MVS JSON snippets that can be inserted into the tree
 * with kind-aware filtering. Templates are UINodes without IDs - IDs are
 * generated at instantiation time.
 */

import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import type { UINode } from './ui-builder.ts';
import { createEmptyNode } from './ui-builder.ts';

// ============================================
// Types
// ============================================

/**
 * MVS node snippet - UINode without id (id added at instantiation)
 */
export type MVSNodeSnippet = Omit<UINode, 'id' | 'children'> & {
  children?: MVSNodeSnippet[];
};

/**
 * Template category for organization
 */
export type TemplateCategory = 'structure' | 'visualization' | 'common' | 'custom';

/**
 * A tree template defines a reusable subtree that can be inserted
 * under nodes with matching parent kinds.
 */
export interface TreeTemplate {
  /** Unique identifier for this template */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this template creates */
  description: string;
  /** Category for grouping in UI */
  category: TemplateCategory;
  /** Parent kinds where this template can be inserted */
  validParentKinds: readonly MVSKind[];
  /** The MVS snippet nodes (array allows multiple siblings) */
  nodes: MVSNodeSnippet[];
}

// ============================================
// Built-in Templates
// ============================================

const DOWNLOAD_PARSE_STRUCTURE_TEMPLATE: TreeTemplate = {
  id: 'download-parse-structure',
  name: 'Load Structure',
  description: 'Download, parse, and create structure from URL',
  category: 'structure',
  validParentKinds: ['root'],
  nodes: [
    {
      kind: 'download',
      params: { url: '' },
      children: [
        {
          kind: 'parse',
          params: { format: 'bcif' },
          children: [
            {
              kind: 'structure',
              params: { type: 'model' },
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

const COMPONENT_REPR_TEMPLATE: TreeTemplate = {
  id: 'component-repr',
  name: 'Component + Representation',
  description: 'Component with representation',
  category: 'visualization',
  validParentKinds: ['structure'],
  nodes: [
    {
      kind: 'component',
      params: { selector: 'all' },
      children: [
        {
          kind: 'representation',
          params: { type: 'cartoon' },
          children: [],
        },
      ],
    },
  ],
};

const COMPONENT_REPR_COLOR_TEMPLATE: TreeTemplate = {
  id: 'component-repr-color',
  name: 'Colored Component',
  description: 'Component with representation and color',
  category: 'visualization',
  validParentKinds: ['structure'],
  nodes: [
    {
      kind: 'component',
      params: { selector: 'all' },
      children: [
        {
          kind: 'representation',
          params: { type: 'cartoon' },
          children: [
            {
              kind: 'color',
              params: { color: '#3050F8' },
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

const REPR_COLOR_LABEL_TEMPLATE: TreeTemplate = {
  id: 'repr-color-label',
  name: 'Repr + Color + Label',
  description: 'Representation with color and text label',
  category: 'visualization',
  validParentKinds: ['component', 'component_from_source', 'component_from_uri'],
  nodes: [
    {
      kind: 'representation',
      params: { type: 'cartoon' },
      children: [
        {
          kind: 'color',
          params: { color: '#3050F8' },
          children: [],
        },
      ],
    },
    {
      kind: 'label',
      params: { text: '' },
      children: [],
    },
  ],
};

const LIGAND_BALL_STICK_TEMPLATE: TreeTemplate = {
  id: 'ligand-ball-stick',
  name: 'Ligand Visualization',
  description: 'Ligand component with ball-and-stick representation',
  category: 'visualization',
  validParentKinds: ['structure'],
  nodes: [
    {
      kind: 'component',
      params: { selector: 'ligand' },
      children: [
        {
          kind: 'representation',
          params: { type: 'ball_and_stick' },
          children: [],
        },
      ],
    },
  ],
};

/**
 * All built-in templates
 */
export const BUILTIN_TEMPLATES: readonly TreeTemplate[] = [
  DOWNLOAD_PARSE_STRUCTURE_TEMPLATE,
  COMPONENT_REPR_TEMPLATE,
  COMPONENT_REPR_COLOR_TEMPLATE,
  REPR_COLOR_LABEL_TEMPLATE,
  LIGAND_BALL_STICK_TEMPLATE,
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get templates that are valid for a given parent kind.
 *
 * @param parentKind - The kind of the parent node
 * @param templates - Templates to filter (defaults to BUILTIN_TEMPLATES)
 * @returns Templates that can be inserted under the parent kind
 */
export function getTemplatesForParentKind(
  parentKind: MVSKind,
  templates: readonly TreeTemplate[] = BUILTIN_TEMPLATES
): TreeTemplate[] {
  return templates.filter((t) => t.validParentKinds.includes(parentKind));
}

/**
 * Convert a snippet to a UINode by recursively adding IDs.
 */
function instantiateSnippet(snippet: MVSNodeSnippet): UINode {
  const node = createEmptyNode(snippet.kind as MVSKind | '');
  node.params = { ...snippet.params };

  if (snippet.ref) {
    node.ref = snippet.ref;
  }

  if (snippet.custom) {
    node.custom = { ...snippet.custom };
  }

  if (snippet.children && snippet.children.length > 0) {
    node.children = snippet.children.map(instantiateSnippet);
  }

  return node;
}

/**
 * Instantiate a template by converting its snippets to UINodes with unique IDs.
 *
 * @param template - The template to instantiate
 * @returns Array of UINodes with unique IDs
 */
export function instantiateTemplate(template: TreeTemplate): UINode[] {
  return template.nodes.map(instantiateSnippet);
}
