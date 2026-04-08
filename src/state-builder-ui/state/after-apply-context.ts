import { createContext, useContext } from 'react';

/** Called after any NodeHelperBase Apply action completes. Used to auto-generate code. */
export const AfterApplyContext = createContext<(() => void) | null>(null);
export function useAfterApply() { return useContext(AfterApplyContext); }
