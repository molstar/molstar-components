import { Button } from '../ui/button.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.tsx';
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, PlusIcon, XIcon, ChevronDownIcon } from 'lucide-react';
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import type { UINode } from '@molstar/state-builder';
import {
  getTemplatesForParentKind,
  instantiateTemplate,
} from '@molstar/state-builder';

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

/**
 * Action buttons for operations: move up/down, add child, copy, remove
 */
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
  // Get templates valid for this parent kind
  const templates = parentKind ? getTemplatesForParentKind(parentKind as MVSKind) : [];
  const hasTemplates = templates.length > 0;

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template && onAddTemplateChildren) {
      const nodes = instantiateTemplate(template);
      onAddTemplateChildren(nodes);
    }
  };

  return (
    <div className='flex gap-1'>
      {onMoveUp && (
        <Button
          variant='ghost'
          size='sm'
          onClick={onMoveUp}
          title='Move up'
          className='h-8 w-8 p-0'
          disabled={isFirst}
        >
          <ArrowUpIcon className='size-4' />
        </Button>
      )}
      {onMoveDown && (
        <Button
          variant='ghost'
          size='sm'
          onClick={onMoveDown}
          title='Move down'
          className='h-8 w-8 p-0'
          disabled={isLast}
        >
          <ArrowDownIcon className='size-4' />
        </Button>
      )}
      {canHaveChildren && onAddChild && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='sm' title='Add child' className='h-8 px-1'>
              <PlusIcon className='size-4' />
              <ChevronDownIcon className='size-3' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={onAddChild}>
              Empty Node
            </DropdownMenuItem>
            {hasTemplates && (
              <>
                <DropdownMenuSeparator />
                {templates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    title={template.description}
                  >
                    {template.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {onCopy && (
        <Button variant='ghost' size='sm' onClick={onCopy} title='Copy operation' className='h-8 w-8 p-0'>
          <CopyIcon className='size-4' />
        </Button>
      )}
      <Button variant='ghost' size='sm' onClick={onRemove} title='Remove operation' className='h-8 w-8 p-0'>
        <XIcon className='size-4' />
      </Button>
    </div>
  );
}
