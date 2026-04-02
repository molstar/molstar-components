import { Label } from '../../ui/label.tsx';
import type { ConstantDefinition } from '@molstar/state-builder';
import { ColorHelper } from '../../ColorHelper.tsx';

interface ColorFieldsProps {
  params: Record<string, unknown>;
  custom?: Record<string, unknown>;
  availableConstants?: ConstantDefinition[];
  onApply: (params: Record<string, unknown>, custom: Record<string, unknown> | undefined) => void;
}

export function ColorFields({
  params,
  custom,
  availableConstants = [],
  onApply,
}: ColorFieldsProps) {
  return (
    <div className='flex-1'>
      <Label className='text-xs'>Color</Label>
      <ColorHelper
        params={params}
        custom={custom}
        availableConstants={availableConstants}
        onApply={onApply}
      />
    </div>
  );
}
