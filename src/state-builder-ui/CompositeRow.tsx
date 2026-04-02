'use client';

import { Button } from './ui/button.tsx';
import { Label } from './ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.tsx';
import type { UINode, ConstantDefinition } from '@molstar/state-builder';
import { createEmptyNode, deepCopyNode, MVS_KIND_LABELS, countSubtreeNodes } from '@molstar/state-builder';
import { ConfirmDialog } from './ui/confirm-dialog.tsx';
import type { CompositeSequence } from '@molstar/state-builder/types/composite-sequences';
import { getCompositeValidChildren, DOWNLOAD_PARSE_SEQUENCE } from '@molstar/state-builder/types/composite-sequences';
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';
import { TreeLines } from './components/TreeLines.tsx';
import { OperationActions } from './components/OperationActions.tsx';
import { DownloadParseFields } from './components/fields/DownloadParseFields.tsx';
import { OperationRow } from './OperationRow.tsx';

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
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'kindChange';
    newKind?: MVSKind;
  } | null>(null);

  const childCount = exitNode.children?.length || 0;
  const subtreeCount = countSubtreeNodes(exitNode);

  // Build the list of kinds for the select, including composite option
  // Filter out 'download' and 'parse' since they're represented by the composite
  const regularKinds = (allowedKinds || []).filter(
    (k) => k !== 'download' && k !== 'parse'
  );

  // Handle kind change - convert composite to regular node if different kind selected
  const handleKindChange = (value: string) => {
    if (value === DOWNLOAD_PARSE_SEQUENCE.selectValue) {
      // Already a composite, nothing to do
      return;
    }
    if (childCount > 0) {
      setPendingAction({ type: 'kindChange', newKind: value as MVSKind });
    } else {
      // Convert to a regular node with the selected kind
      onUpdate({
        kind: value as MVSKind,
        params: {},
        children: [],
        ref: undefined,
      });
    }
  };

  const handleRemove = () => {
    if (childCount > 0) {
      setPendingAction({ type: 'delete' });
    } else {
      onRemove();
    }
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'delete') {
      onRemove();
    } else if (pendingAction.type === 'kindChange' && pendingAction.newKind) {
      onUpdate({
        kind: pendingAction.newKind,
        params: {},
        children: [],
        ref: undefined,
      });
    }

    setPendingAction(null);
  };

  const handleDownloadParamsChange = (params: Record<string, unknown>) => {
    onUpdate({ params });
  };

  const handleParseParamsChange = (params: Record<string, unknown>) => {
    const updatedExitNode = { ...exitNode, params };
    onUpdate({
      children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
    });
  };

  const handleRefChange = (ref: string) => {
    if (ref) {
      // Set refs on both nodes
      const updatedExitNode = { ...exitNode, ref: ref + 'Parse' };
      onUpdate({
        ref,
        children: [updatedExitNode, ...(rootNode.children?.slice(1) || [])],
      });
    } else {
      // Remove refs from both nodes
      const { ref: _rootRef, ...restRootProps } = rootNode;
      const { ref: _exitRef, ...restExitProps } = exitNode;
      const updatedExitNode = { ...restExitProps, ref: undefined };
      onUpdate({
        ref: undefined,
        children: [updatedExitNode as UINode, ...(rootNode.children?.slice(1) || [])],
      });
    }
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

  return (
    <div className='relative' style={{ marginLeft: depth > 0 ? '20px' : '0' }}>
      <TreeLines depth={depth} isLast={isLast} />

      <div className='border rounded-md p-2 bg-card'>
        <div className='flex gap-2 items-end'>
          {/* Expand/collapse button */}
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsExpanded(!isExpanded)}
            className='h-8 w-8 p-0'
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDownIcon className='size-4' /> : <ChevronRightIcon className='size-4' />}
          </Button>

          {/* Kind selector with composite option */}
          <div className='w-40'>
            <Label className='text-xs'>Kind</Label>
            <Select value={DOWNLOAD_PARSE_SEQUENCE.selectValue} onValueChange={handleKindChange}>
              <SelectTrigger size='sm'>
                <SelectValue>{sequence.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {/* Composite option first */}
                <SelectItem value={DOWNLOAD_PARSE_SEQUENCE.selectValue}>
                  {DOWNLOAD_PARSE_SEQUENCE.label}
                </SelectItem>
                {/* Other valid kinds */}
                {regularKinds.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {MVS_KIND_LABELS[kind] ?? kind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Combined fields for download + parse */}
          <DownloadParseFields
            downloadNode={rootNode}
            parseNode={exitNode}
            onDownloadChange={handleDownloadParamsChange}
            onParseChange={handleParseParamsChange}
            onRefChange={handleRefChange}
            availableConstants={availableConstants}
          />

          {/* Action buttons */}
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
        </div>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction?.type === 'delete' ? 'Delete Node?' : 'Change Kind?'}
        description={
          pendingAction?.type === 'delete'
            ? `This will delete this node and ${subtreeCount} child node${subtreeCount !== 1 ? 's' : ''}. This cannot be undone.`
            : `Changing the kind will delete ${subtreeCount} child node${subtreeCount !== 1 ? 's' : ''}. This cannot be undone.`
        }
        confirmText={pendingAction?.type === 'delete' ? 'Delete' : 'Change Kind'}
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
