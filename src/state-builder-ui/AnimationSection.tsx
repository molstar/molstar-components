'use client';

import { Button } from './ui/button.tsx';
import { ChevronDownIcon, ChevronRightIcon, FilmIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { AnimationHelper } from './AnimationHelper.tsx';
import type { AnimationParams, RefInfo } from '@molstar/state-builder';
import { computeAnimationDuration } from '@molstar/state-builder';

interface AnimationSectionProps {
  animation: AnimationParams | null;
  onAnimationChange: (animation: AnimationParams | null) => void;
  availableRefs: RefInfo[];
}

export function AnimationSection({ animation, onAnimationChange, availableRefs }: AnimationSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const stepCount = animation?.steps.length ?? 0;
  const totalDuration = animation ? computeAnimationDuration(animation.steps) : 0;

  const flags: string[] = [];
  if (animation?.autoplay) flags.push('autoplay');
  if (animation?.loop) flags.push('loop');
  if (animation?.trackball?.enabled) flags.push('spin');

  return (
    <div className='border rounded-md'>
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
                  onApply={onAnimationChange}
                  initialValue={animation}
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
                onApply={onAnimationChange}
                initialValue={null}
                availableRefs={availableRefs}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
