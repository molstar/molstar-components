import { Label } from '../ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.tsx';
import type { MVSKind } from 'molstar/lib/extensions/mvs/tree/mvs/mvs-tree';
import { MVS_KIND_LABELS, MVS_SELECTABLE_KINDS, DOWNLOAD_PARSE_SEQUENCE } from '@molstar/state-builder';
import { createDownloadParseNodes } from '@molstar/state-builder/types/composite-sequences';

interface KindSelectProps {
  value: MVSKind | '';
  onChange: (kind: MVSKind) => void;
  onCompositeSelect?: (node: ReturnType<typeof createDownloadParseNodes>) => void;
  allowedKinds?: readonly MVSKind[];
}

export function KindSelect({ value, onChange, onCompositeSelect, allowedKinds }: KindSelectProps) {
  // Use allowed kinds if provided, otherwise show all selectable kinds
  // Camera is always filtered out — it's managed by the dedicated CameraSection
  const kindsToShow = (allowedKinds ?? MVS_SELECTABLE_KINDS).filter((k) => k !== 'camera');

  const showCompositeOption = kindsToShow.includes('download');

  const regularKinds = showCompositeOption
    ? kindsToShow.filter((k) => k !== 'download' && k !== 'parse')
    : kindsToShow;

  const handleChange = (selectedValue: string) => {
    if (selectedValue === DOWNLOAD_PARSE_SEQUENCE.selectValue) {
      // Create composite node and pass it to parent
      if (onCompositeSelect) {
        const compositeNode = createDownloadParseNodes();
        onCompositeSelect(compositeNode);
      }
    } else {
      onChange(selectedValue as MVSKind);
    }
  };

  return (
    <div className='w-40'>
      <Label className='text-xs'>Kind</Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger size='sm'>
          <SelectValue placeholder='Select kind' />
        </SelectTrigger>
        <SelectContent>
          {/* Show composite option first if available */}
          {showCompositeOption && (
            <SelectItem value={DOWNLOAD_PARSE_SEQUENCE.selectValue}>
              {DOWNLOAD_PARSE_SEQUENCE.label}
            </SelectItem>
          )}
          {/* Regular kinds */}
          {regularKinds.map((kind) => (
            <SelectItem key={kind} value={kind}>
              {MVS_KIND_LABELS[kind] ?? kind}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
