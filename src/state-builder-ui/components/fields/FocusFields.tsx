import { FocusHelper } from '../../FocusHelper.tsx';

interface FocusFieldsProps {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function FocusFields({ params, onChange }: FocusFieldsProps) {
  return <FocusHelper params={params} onChange={onChange} />;
}
