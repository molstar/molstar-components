'use client';

import { Button } from '../../base/button.tsx';
import type { StructureMetadata } from '@molstar/state-builder';
import { DatabaseIcon, Loader2Icon } from 'lucide-react';

interface MetadataStatusProps {
  metadata: StructureMetadata | null;
  isLoading: boolean;
  hasStructures: boolean;
  error: string | null;
  onLoadMetadata: () => void;
  onGenerateAndLoad: (() => void) | null;
  onRefreshMetadata: () => void;
  onClearMetadata: () => void;
}

export function MetadataStatus({
  metadata,
  isLoading,
  hasStructures,
  error,
  onLoadMetadata,
  onGenerateAndLoad,
  onRefreshMetadata,
  onClearMetadata,
}: MetadataStatusProps) {
  return (
    <div className='space-y-2'>
      {/* Show load button when no metadata */}
      {!metadata && (
        <div className='flex items-center gap-2 p-2 rounded-md bg-muted/50 border text-sm'>
          <DatabaseIcon className='size-4 text-muted-foreground shrink-0' />
          <span className='flex-1 text-muted-foreground'>
            {hasStructures
              ? 'Load chains and ligands from the 3D structure'
              : 'Generate code to load the structure and extract chain/ligand data'}
          </span>
          {isLoading ? (
            <Button size='sm' variant='outline' disabled className='shrink-0'>
              <Loader2Icon className='size-4 mr-1 animate-spin' />
              Loading...
            </Button>
          ) : hasStructures ? (
            <Button size='sm' variant='outline' onClick={onLoadMetadata} className='shrink-0'>
              Load from structure
            </Button>
          ) : onGenerateAndLoad ? (
            <Button size='sm' variant='default' onClick={onGenerateAndLoad} className='shrink-0'>
              Generate & Load
            </Button>
          ) : null}
        </div>
      )}

      {/* Show error if present */}
      {error && (
        <div className='flex items-center gap-2 p-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300'>
          <span>{error}</span>
        </div>
      )}

      {/* Show success when metadata is loaded */}
      {metadata && (
        <div className='flex items-center gap-2 p-2 rounded-md bg-green-50 border border-green-200 text-sm text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300'>
          <DatabaseIcon className='size-4 shrink-0' />
          <span className='flex-1'>
            Loaded {metadata.chains.length} chains, {metadata.ligands.length} ligands
          </span>
          <Button size='sm' variant='outline' onClick={onRefreshMetadata} className='shrink-0 h-6 text-xs px-2'>
            Refresh
          </Button>
          <Button size='sm' variant='ghost' onClick={onClearMetadata} className='shrink-0 h-6 text-xs px-2 text-muted-foreground'>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
