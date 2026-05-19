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
} from '../base/dropdown-menu.tsx';
import { Button } from '../base/button.tsx';
import { MoreHorizontalIcon } from 'lucide-react';
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import type { UINode } from '../../state-builder/index.ts';
import { MVS_KIND_LABELS, getTemplatesForParentKind, instantiateTemplate } from '../../state-builder/index.ts';

interface OperationActionsProps {
  canHaveChildren?: boolean;
  isFirst: boolean;
  isLast: boolean;
  parentKind?: MVSKind | '';
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAddChild?: () => void;
  onAddChildWithKind?: (kind: MVSKind) => void;
  onAddTemplateChildren?: (nodes: UINode[]) => void;
  onCopy?: () => void;
  onRemove: () => void;
  validChildKinds?: readonly MVSKind[];
}

export function OperationActions({
  canHaveChildren,
  isFirst,
  isLast,
  parentKind,
  onMoveUp,
  onMoveDown,
  onAddChild,
  onAddChildWithKind,
  onAddTemplateChildren,
  onCopy,
  onRemove,
  validChildKinds,
}: OperationActionsProps) {
  const templates = parentKind ? getTemplatesForParentKind(parentKind as MVSKind) : [];
  const hasTemplates = templates.length > 0;
  const hasKinds = !!validChildKinds && validChildKinds.length > 0;
  const needsSubmenu = canHaveChildren && onAddChild && (hasKinds || hasTemplates);

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
          needsSubmenu ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Add child</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {hasKinds && validChildKinds!.map((kind) => (
                  <DropdownMenuItem
                    key={kind}
                    onClick={() => onAddChildWithKind?.(kind)}
                  >
                    {MVS_KIND_LABELS[kind]}
                  </DropdownMenuItem>
                ))}
                {hasKinds && hasTemplates && <DropdownMenuSeparator />}
                {hasTemplates && templates.map((t) => (
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
          )
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
