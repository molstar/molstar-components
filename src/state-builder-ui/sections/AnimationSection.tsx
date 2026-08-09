'use client';

import { Button } from '../base/button.tsx';
import { ChevronDownIcon, ChevronRightIcon, FilmIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { AnimationHelper } from '../helpers/AnimationHelper.tsx';
import type { AnimationParams, RefInfo, UINode } from '../../state-builder/index.ts';
import { computeAnimationDuration } from '../../state-builder/index.ts';

interface AnimationSectionProps {
  animation: AnimationParams | null;
  onAnimationChange: (animation: AnimationParams | null) => void;
  availableRefs: RefInfo[];
}

function animationToUINode(animation: AnimationParams | null): UINode {
  return {
    id: '__animation__',
    kind: '',
    params: (animation ?? {}) as unknown as Record<string, unknown>,
    custom: animation?.custom,
    children: [],
  };
}

export function AnimationSection({ animation, onAnimationChange, availableRefs }: AnimationSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const stepCount = animation?.steps.length ?? 0;
  const totalDuration = animation ? computeAnimationDuration(animation.steps) : 0;

  const flags: string[] = [];
  if (animation?.autoplay) flags.push('autoplay');
  if (animation?.loop) flags.push('loop');
  if (animation?.trackball?.enabled) flags.push('spin');

  const animNode = animationToUINode(animation);
  const handleUpdate = (updates: Partial<UINode>) => {
    const p = updates.params as unknown as AnimationParams | undefined;
    if (p?.steps !== undefined) {
      onAnimationChange({
        ...p,
        custom: updates.custom as Record<string, unknown> | undefined,
      });
    }
  };

  return (
    <div className='border rounded-lg bg-card shadow-sm'>
      {/* Header */}
      <div
        className='flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50'
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDownIcon className='size-4' />
        ) : (
          <ChevronRightIcon className='size-4' />
        )}
        <span className='inline-block rounded-full shrink-0' style={{ width: 7, height: 7, background: '#ec4899' }} />
        <FilmIcon className='size-4' />
        <span className='text-sm font-medium'>Animation</span>
        <span className='text-xs text-muted-foreground'>
          {animation ? `${stepCount} step${stepCount !== 1 ? 's' : ''}` : 'not set'}
        </span>
      </div>

      {/* Content */}
      {expanded && (
        <div className='p-2 pt-0 space-y-2'>
          {animation ? (
            <>
              {/* Compact summary */}
              <div className='text-xs font-mono bg-muted/50 rounded-md p-2 space-y-0.5'>
                {totalDuration > 0 && (
                  <div>
                    <span className='text-muted-foreground'>Duration: </span>
                    {animation.duration_ms ?? totalDuration}ms
                    {animation.duration_ms === null && totalDuration > 0 && ' (auto)'}
                  </div>
                )}
                {flags.length > 0 && (
                  <div>
                    <span className='text-muted-foreground'>Flags: </span>
                    {flags.join(', ')}
                  </div>
                )}
                {stepCount > 0 && (
                  <div>
                    <span className='text-muted-foreground'>Steps: </span>
                    {animation.steps.map((s) => `${s.kind}→${s.target_ref || '?'}`).join(', ')}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className='flex gap-2'>
                <AnimationHelper
                  node={animNode}
                  onUpdate={handleUpdate}
                  availableRefs={availableRefs}
                />
                <Button
                  size='sm'
                  variant='ghost'
                  className='h-8'
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnimationChange(null);
                  }}
                  title='Remove animation'
                >
                  <XIcon className='size-4 mr-1' />
                  Clear
                </Button>
              </div>
            </>
          ) : (
            <div className='flex flex-col items-center gap-2 py-2'>
              <p className='text-sm text-muted-foreground'>No animation set.</p>
              <AnimationHelper
                node={animNode}
                onUpdate={handleUpdate}
                availableRefs={availableRefs}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
