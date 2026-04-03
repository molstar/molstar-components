'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.tsx';
import { Button } from '../ui/button.tsx';
import { MoreHorizontalIcon } from 'lucide-react';
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import type { UINode } from '@molstar/state-builder';
import { getTemplatesForParentKind, instantiateTemplate } from '@molstar/state-builder';

interface OperationActionsProps {
  canHaveChildren?: boolean;
  isFirst: boolean;
  isLast: boolean;
  parentKind?: MVSKind | '';
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAddChild?: () => void;
  onAddTemplateChildren?: (nodes: UINode[]) => void;
  onCopy?: () => void;
  onRemove: () => void;
}

export function OperationActions({
  canHaveChildren,
  isFirst,
  isLast,
  parentKind,
  onMoveUp,
  onMoveDown,
  onAddChild,
  onAddTemplateChildren,
  onCopy,
  onRemove,
}: OperationActionsProps) {
  const templates = parentKind ? getTemplatesForParentKind(parentKind as MVSKind) : [];
  const hasTemplates = templates.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='h-7 w-7 p-0 shrink-0'>
          <MoreHorizontalIcon className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-[160px]'>
        <DropdownMenuItem onClick={onMoveUp} disabled={isFirst || !onMoveUp}>
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMoveDown} disabled={isLast || !onMoveDown}>
          Move down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {onCopy && (
          <DropdownMenuItem onClick={onCopy}>Duplicate</DropdownMenuItem>
        )}
        {canHaveChildren && onAddChild && (
          <>
            {hasTemplates ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Add child</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={onAddChild}>Empty node</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {templates.map((t) => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => {
                        const nodes = instantiateTemplate(t);
                        onAddTemplateChildren?.(nodes);
                      }}
                      title={t.description}
                    >
                      {t.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : (
              <DropdownMenuItem onClick={onAddChild}>Add child</DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onRemove}
          className='text-destructive focus:text-destructive'
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
