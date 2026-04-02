'use client';

/**
 * Context for providing structure metadata to UI builder components.
 *
 * This allows SelectorHelper and other components to access loaded
 * structure metadata without prop drilling through the component tree.
 */

import type { StructureMetadata } from '@molstar/state-builder';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import {
  extractMetadataFromPlugin,
  hasLoadedStructures,
} from './hooks/useStructureMetadataLoader.ts';

interface StructureMetadataContextValue {
  /** Extracted structure metadata, or null if not loaded */
  metadata: StructureMetadata | null;
  /** Whether metadata extraction is in progress */
  isLoading: boolean;
  /** Trigger metadata extraction from loaded structures */
  loadMetadata: () => void;
  /** Clear loaded metadata */
  clearMetadata: () => void;
  /** Whether there are any structures loaded in the plugin */
  hasStructures: boolean;
  /** Error message if extraction failed */
  error: string | null;
  /** Generate code and load the scene, then extract metadata */
  generateAndLoad: (() => void) | null;
}

const StructureMetadataContext = createContext<StructureMetadataContextValue | null>(null);

interface StructureMetadataProviderProps {
  plugin: PluginUIContext | null;
  children: ReactNode;
  /** Optional callback to generate code - when provided, enables "Generate & Load" functionality */
  onGenerateCode?: () => void;
}

export function StructureMetadataProvider({
  plugin,
  children,
  onGenerateCode,
}: StructureMetadataProviderProps) {
  const [metadata, setMetadata] = useState<StructureMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearMetadata = useCallback(() => {
    setMetadata(null);
    setError(null);
  }, []);

  const loadMetadata = useCallback(() => {
    if (!plugin) {
      setError('No viewer available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const extracted = extractMetadataFromPlugin(plugin);
      if (extracted) {
        setMetadata(extracted);
      } else {
        setError('No structure data found');
      }
    } catch (e) {
      console.error('Failed to extract structure metadata:', e);
      setError(e instanceof Error ? e.message : 'Extraction failed');
    } finally {
      setIsLoading(false);
    }
  }, [plugin]);

  // Generate code, wait for structure to load, then extract metadata
  const generateAndLoad = useCallback(() => {
    if (!onGenerateCode || !plugin) return;

    setIsLoading(true);
    setError(null);

    // Trigger code generation
    onGenerateCode();

    // Poll for structure to be loaded (with timeout)
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds max
    const pollInterval = setInterval(() => {
      attempts++;
      if (hasLoadedStructures(plugin)) {
        clearInterval(pollInterval);
        // Small delay to ensure structure is fully ready
        setTimeout(() => {
          try {
            const extracted = extractMetadataFromPlugin(plugin);
            if (extracted) {
              setMetadata(extracted);
            } else {
              setError('No structure data found after loading');
            }
          } catch (e) {
            console.error('Failed to extract structure metadata:', e);
            setError(e instanceof Error ? e.message : 'Extraction failed');
          } finally {
            setIsLoading(false);
          }
        }, 500);
      } else if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        setIsLoading(false);
        setError('Timed out waiting for structure to load');
      }
    }, 500);
  }, [plugin, onGenerateCode]);

  const hasStructures = plugin ? hasLoadedStructures(plugin) : false;

  return (
    <StructureMetadataContext.Provider
      value={{
        metadata,
        isLoading,
        loadMetadata,
        clearMetadata,
        hasStructures,
        error,
        generateAndLoad: onGenerateCode && plugin ? generateAndLoad : null,
      }}
    >
      {children}
    </StructureMetadataContext.Provider>
  );
}

/**
 * Hook to access structure metadata context.
 * Returns null if used outside of StructureMetadataProvider.
 */
export function useStructureMetadataContext() {
  return useContext(StructureMetadataContext);
}
