import { FocusHelper } from '../../helpers/FocusHelper.tsx';
import type { UINode } from '@molstar/state-builder';

interface FocusFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

// Synthetic UINode for use when caller only has params + onChange (e.g. OperationRow)
function makeFocusNode(params: Record<string, unknown>): UINode {
  return { id: '__focus__', kind: 'focus', params, children: [] };
}

export function FocusFields({ params, onChange }: FocusFieldsProps) {
  const node = makeFocusNode(params);
  const handleUpdate = (updates: Partial<UINode>) => {
    if (updates.params) onChange(updates.params);
  };
  return <FocusHelper node={node} onUpdate={handleUpdate} />;
}
