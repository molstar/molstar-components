'use client';

import { Button } from './ui/button.tsx';
import type { UINode, ConstantDefinition } from '@molstar/state-builder';
import { createEmptyNode, deepCopyNode, countSubtreeNodes } from '@molstar/state-builder';
import { ConfirmDialog } from './ui/confirm-dialog.tsx';
import type { CompositeSequence } from '@molstar/state-builder/types/composite-sequences';
import { getCompositeValidChildren } from '@molstar/state-builder/types/composite-sequences';
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';
import { TreeLines } from './components/TreeLines.tsx';
import { OperationActions } from './components/OperationActions.tsx';
import { OperationRow } from './OperationRow.tsx';
import { CompositeHelper } from './CompositeHelper.tsx';
import { getColorForKind } from './node-categories.ts';

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.split('/').pop() ?? '';
    return `${u.hostname}/…/${path}`.slice(0, 50);
  } catch {
    return url.slice(0, 50);
  }
}

interface CompositeRowProps {
  sequence: CompositeSequence;
  rootNode: UINode; // download
  exitNode: UINode; // parse
  onUpdate: (updates: Partial<UINode>) => void;
  onRemove: () => void;
  onAddChild?: () => void;
  onAddTemplateChildren?: (nodes: UINode[]) => void;
  onCopy?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  depth?: number;
  isFirst?: boolean;
  isLast?: boolean;
  availableConstants?: ConstantDefinition[];
  allowedKinds?: readonly MVSKind[];
  allNodes?: UINode[];
}

export function CompositeRow({
  sequence,
  rootNode,
  exitNode,
  onUpdate,
  onRemove,
  onCopy,
  onMoveUp,
  onMoveDown,
  depth = 0,
  isFirst = false,
  isLast = false,
  availableConstants = [],
  allowedKinds,
  allNodes = [],
}: CompositeRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [helperOpen, setHelperOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete';
  } | null>(null);

  const childCount = exitNode.children?.length || 0;
  const subtreeCount = countSubtreeNodes(exitNode);

  const handleRemove = () => {
    if (childCount > 0) {
      setPendingAction({ type: 'delete' });
    } else {
      onRemove();
    }
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    onRemove();
    setPendingAction(null);
  };

  const handleUpdateDownload = (updates: Partial<UINode>) => {
    onUpdate(updates);
  };

  const handleUpdateParse = (updates: Partial<UINode>) => {
    const updatedExitNode = { ...exitNode, ...updates };
    onUpdate({
      children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
    });
  };

  const handleAddChild = () => {
    const newChild = createEmptyNode();
    const updatedExitNode = {
      ...exitNode,
      children: [...(exitNode.children || []), newChild],
    };
    onUpdate({
      children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
    });
  };

  const handleAddTemplateChildren = (templateNodes: UINode[]) => {
    const updatedExitNode = {
      ...exitNode,
      children: [...(exitNode.children || []), ...templateNodes],
    };
    onUpdate({
      children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
    });
  };

  const handleUpdateChild = (childIndex: number, updates: Partial<UINode>) => {
    const currentChildren = exitNode.children || [];
    const updatedChildren = currentChildren.map((child, i) =>
      i === childIndex ? { ...child, ...updates } : child
    );
    const updatedExitNode = { ...exitNode, children: updatedChildren };
    onUpdate({
      children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
    });
  };

  const handleRemoveChild = (childIndex: number) => {
    const currentChildren = exitNode.children || [];
    const updatedChildren = currentChildren.filter((_, i) => i !== childIndex);
    const updatedExitNode = { ...exitNode, children: updatedChildren };
    onUpdate({
      children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
    });
  };

  const handleAddGrandChild = (childIndex: number) => {
    const currentChildren = exitNode.children || [];
    const child = currentChildren[childIndex];
    if (!child) return;

    const newGrandChild = createEmptyNode();
    const updatedChild = {
      ...child,
      children: [...(child.children || []), newGrandChild],
    };
    const updatedChildren = currentChildren.map((c, i) =>
      i === childIndex ? updatedChild : c
    );
    const updatedExitNode = { ...exitNode, children: updatedChildren };
    onUpdate({
      children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
    });
  };

  const handleAddTemplateGrandChildren = (childIndex: number, templateNodes: UINode[]) => {
    const currentChildren = exitNode.children || [];
    const child = currentChildren[childIndex];
    if (!child) return;

    const updatedChild = {
      ...child,
      children: [...(child.children || []), ...templateNodes],
    };
    const updatedChildren = currentChildren.map((c, i) =>
      i === childIndex ? updatedChild : c
    );
    const updatedExitNode = { ...exitNode, children: updatedChildren };
    onUpdate({
      children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
    });
  };

  const handleCopyChild = (childIndex: number) => {
    const currentChildren = exitNode.children || [];
    const child = currentChildren[childIndex];
    if (!child) return;

    const copiedChild = deepCopyNode(child);
    const updatedExitNode = {
      ...exitNode,
      children: [...currentChildren, copiedChild],
    };
    onUpdate({
      children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
    });
  };

  const handleMoveChildUp = (childIndex: number) => {
    if (childIndex === 0) return;
    const currentChildren = [...(exitNode.children || [])];
    [currentChildren[childIndex - 1], currentChildren[childIndex]] = [
      currentChildren[childIndex],
      currentChildren[childIndex - 1],
    ];
    const updatedExitNode = { ...exitNode, children: currentChildren };
    onUpdate({
      children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
    });
  };

  const handleMoveChildDown = (childIndex: number) => {
    const currentChildren = exitNode.children || [];
    if (childIndex >= currentChildren.length - 1) return;
    const newChildren = [...currentChildren];
    [newChildren[childIndex], newChildren[childIndex + 1]] = [
      newChildren[childIndex + 1],
      newChildren[childIndex],
    ];
    const updatedExitNode = { ...exitNode, children: newChildren };
    onUpdate({
      children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
    });
  };

  const validChildKinds = getCompositeValidChildren(sequence);
  const hasChildren = exitNode.children && exitNode.children.length > 0;
  const dotColor = getColorForKind('download');

  return (
    <div className='relative' style={{ marginLeft: depth > 0 ? '20px' : '0' }}>
      <TreeLines depth={depth} isLast={isLast} />

      <div className='border rounded-lg px-3 py-2 bg-card shadow-sm flex items-center gap-2'>
        {/* Expand/collapse button */}
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setIsExpanded(!isExpanded)}
          className='h-6 w-6 p-0 shrink-0'
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronDownIcon className='size-3' /> : <ChevronRightIcon className='size-3' />}
        </Button>

        {/* Kind label — fixed composite label */}
        <span className='text-xs font-semibold text-muted-foreground flex items-center gap-1.5 min-w-[90px]'>
          <span
            className='inline-block rounded-full shrink-0'
            style={{ width: 7, height: 7, background: dotColor }}
          />
          Download/Parse
        </span>

        {/* Summary button */}
        <button
          type='button'
          onClick={() => setHelperOpen(true)}
          className='flex-1 min-w-0 text-left text-xs px-2 py-1 rounded-md border bg-muted/40 truncate hover:bg-muted hover:border-border cursor-pointer text-foreground transition-colors'
        >
          {(rootNode.params.url as string) ? truncateUrl(rootNode.params.url as string) : 'click to configure…'}
        </button>

        <OperationActions
          canHaveChildren={true}
          isFirst={isFirst}
          isLast={isLast}
          parentKind={sequence.exitKind}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onAddChild={handleAddChild}
          onAddTemplateChildren={handleAddTemplateChildren}
          onCopy={onCopy}
          onRemove={handleRemove}
        />

        <CompositeHelper
          downloadNode={rootNode}
          parseNode={exitNode}
          onUpdateDownload={handleUpdateDownload}
          onUpdateParse={handleUpdateParse}
          open={helperOpen}
          onOpenChange={setHelperOpen}
        />
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title='Delete Node?'
        description={`This will delete this node and ${subtreeCount} child node${subtreeCount !== 1 ? 's' : ''}. This cannot be undone.`}
        confirmText='Delete'
        onConfirm={handleConfirmAction}
        isDestructive
      />

      {/* Children of parse node */}
      {isExpanded && hasChildren && (
        <div className='mt-2 space-y-2'>
          {exitNode.children!.map((child, index) => (
            <OperationRow
              key={child.id}
              node={child}
              depth={depth + 1}
              isFirst={index === 0}
              isLast={index === exitNode.children!.length - 1}
              availableConstants={availableConstants}
              allowedKinds={validChildKinds}
              allNodes={allNodes}
              onUpdate={(updates) => handleUpdateChild(index, updates)}
              onRemove={() => handleRemoveChild(index)}
              onAddChild={() => handleAddGrandChild(index)}
              onAddTemplateChildren={(templateNodes) => handleAddTemplateGrandChildren(index, templateNodes)}
              onCopy={() => handleCopyChild(index)}
              onMoveUp={() => handleMoveChildUp(index)}
              onMoveDown={() => handleMoveChildDown(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
