import { Label } from '../../ui/label.tsx';
import { Button } from '../../ui/button.tsx';
import { TransformHelper } from '../../helpers/TransformHelper.tsx';
import { XIcon } from 'lucide-react';
import type { UINode } from '../../../state-builder/index.ts';

interface TransformFieldsProps {
  node: UINode;
  onUpdate: (updates: Partial<UINode>) => void;
}

export function TransformFields({ node, onUpdate }: TransformFieldsProps) {
  const params = node.params as Record<string, unknown> | undefined ?? {};
  const hasTransform = !!(params.rotation || params.translation || params.rotation_center || params.matrix);

  const handleClear = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rotation, translation, rotation_center, matrix, ...rest } = params;
    onUpdate({ params: rest });
  };

  return (
    <div className='flex-1'>
      <Label className='text-xs'>Transform</Label>
      <div className='flex gap-1'>
        <div className='flex-1'>
          <TransformHelper
            node={node}
            onUpdate={onUpdate}
          />
        </div>
        {hasTransform && (
          <Button
            size='sm'
            variant='ghost'
            onClick={handleClear}
            title='Clear transform'
            className='h-8 px-2'
          >
            <XIcon className='size-4' />
          </Button>
        )}
      </div>
    </div>
  );
}
