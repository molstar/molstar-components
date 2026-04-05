'use client';

import { createContext, useContext } from 'react';
import type { ComponentSelectorValue } from '@molstar/state-builder';

/**
 * Carries the nearest ancestor `component` node's selector value down the
 * OperationRow tree. Consumed by annotation helpers (color, label, etc.) to
 * filter their sub-selector UI to only what the parent component selects.
 *
 * Value is `undefined` when there is no ancestor component in scope.
 */
const AncestorComponentContext = createContext<ComponentSelectorValue | undefined>(undefined);

/** Wrap component-node children with this provider to set the context. */
export const AncestorComponentProvider = AncestorComponentContext.Provider;

/** Returns the nearest ancestor component's selector, or undefined if none. */
export function useAncestorComponentSelector(): ComponentSelectorValue | undefined {
  return useContext(AncestorComponentContext);
}
