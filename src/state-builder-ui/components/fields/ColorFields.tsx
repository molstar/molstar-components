import { Label } from '../../ui/label.tsx';
import type { UINode, ConstantDefinition } from '@molstar/state-builder';
import { ColorHelper } from '../../helpers/ColorHelper.tsx';

interface ColorFieldsProps {
  node: UINode;
  availableConstants?: ConstantDefinition[];
  onUpdate: (updates: Partial<UINode>) => void;
}

export function ColorFields({
  node,
  availableConstants = [],
  onUpdate,
}: ColorFieldsProps) {
  return (
    <div className='flex-1'>
      <Label className='text-xs'>Color</Label>
      <ColorHelper
        node={node}
        availableConstants={availableConstants}
        onUpdate={onUpdate}
      />
    </div>
  );
}
