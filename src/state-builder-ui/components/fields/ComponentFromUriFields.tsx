import { Label } from '../../ui/label.tsx';
import { AnnotationHelper } from '../../AnnotationHelper.tsx';

interface Props { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void; }

export function ComponentFromUriFields({ params, onChange }: Props) {
  return (
    <div className='flex-1'>
      <Label className='text-xs'>Annotation</Label>
      <AnnotationHelper params={params} onChange={onChange} hasUri hasFieldValues />
    </div>
  );
}
