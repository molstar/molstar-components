import { Label } from '../../ui/label.tsx';
import { Button } from '../../ui/button.tsx';
import { TransformHelper } from '../../TransformHelper.tsx';
import type { TransformParams } from '../../transform-helper/index.ts';
import { XIcon } from 'lucide-react';

interface TransformFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function TransformFields({ params, onChange }: TransformFieldsProps) {
  const hasTransform = !!(params.rotation || params.translation || params.rotation_center || params.matrix);

  const handleTransformApply = (transform: TransformParams) => {
    const newParams: Record<string, unknown> = { ...params };

    if (transform.rotation) {
      newParams.rotation = transform.rotation;
    } else {
      delete newParams.rotation;
    }

    if (transform.translation) {
      newParams.translation = transform.translation;
    } else {
      delete newParams.translation;
    }

    if (transform.rotation_center !== undefined && transform.rotation_center !== null) {
      newParams.rotation_center = transform.rotation_center;
    } else {
      delete newParams.rotation_center;
    }

    if (transform.matrix) {
      newParams.matrix = transform.matrix;
    } else {
      delete newParams.matrix;
    }

    onChange(newParams);
  };

  const handleClear = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rotation, translation, rotation_center, matrix, ...rest } = params;
    onChange(rest);
  };

  return (
    <div className='flex-1'>
      <Label className='text-xs'>Transform</Label>
      <div className='flex gap-1'>
        <div className='flex-1'>
          <TransformHelper
            onApply={handleTransformApply}
            initialValue={params}
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
