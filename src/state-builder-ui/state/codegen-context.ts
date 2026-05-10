import { createContext, useContext } from 'react';

export const CodeGenContext = createContext<((code: string) => void) | null>(null);
export function useCodeGenCallback() { return useContext(CodeGenContext); }
