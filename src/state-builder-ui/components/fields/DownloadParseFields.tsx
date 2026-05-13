import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx';
import type { UINode, ConstantDefinition, ConstantRef } from '../../../state-builder/index.ts';
import {
  createConstantRef,
  isConstantRef,
  PARSE_FORMATS,
  getActiveValues,
} from '../../../state-builder/index.ts';

interface DownloadParseFieldsProps {
  downloadNode: UINode;
  parseNode: UINode;
  onDownloadChange: (params: Record<string, unknown>) => void;
  onParseChange: (params: Record<string, unknown>) => void;
  onRefChange: (ref: string) => void;
  availableConstants?: ConstantDefinition[];
}

type UrlMode = 'literal' | 'constant';

export function DownloadParseFields({
  downloadNode,
  parseNode,
  onDownloadChange,
  onParseChange,
  onRefChange,
  availableConstants = [],
}: DownloadParseFieldsProps) {
  const urlConstants = availableConstants.filter((c) => c.type === 'urls');
  const activeFormats = getActiveValues(PARSE_FORMATS);

  const hasConstantRef = isConstantRef(downloadNode.params.url);
  const urlMode: UrlMode = hasConstantRef ? 'constant' : 'literal';

  const currentConstantRef = hasConstantRef ? (downloadNode.params.url as ConstantRef) : null;
  const literalUrl = hasConstantRef ? '' : ((downloadNode.params.url as string) || '');
  const format = (parseNode.params.format as string) || 'bcif';
  const ref = downloadNode.ref || '';

  const currentConstantValue = currentConstantRef
    ? `${currentConstantRef.constantName}:${currentConstantRef.entryKey}`
    : '';

  // Build list of available constant entries
  const constantOptions = urlConstants.flatMap((c) =>
    c.entries
      .filter((e) => e.key)
      .map((e) => ({
        value: `${c.name}:${e.key}`,
        label: `${c.name}.${e.key}`,
        preview: e.value.length > 30 ? e.value.slice(0, 30) + '...' : e.value,
      }))
  );

  const handleModeChange = (mode: UrlMode) => {
    if (mode === 'literal') {
      onDownloadChange({ ...downloadNode.params, url: '' });
    } else if (mode === 'constant') {
      // Set first available constant entry as default if available
      if (urlConstants.length > 0 && urlConstants[0].entries.length > 0) {
        const firstConst = urlConstants[0];
        const firstEntry = firstConst.entries.find((e) => e.key) || firstConst.entries[0];
        onDownloadChange({ ...downloadNode.params, url: createConstantRef(firstConst.name, firstEntry.key) });
      } else {
        onDownloadChange({ ...downloadNode.params, url: createConstantRef('', '') });
      }
    }
  };

  const handleConstantRefChange = (constantName: string, entryKey: string) => {
    onDownloadChange({ ...downloadNode.params, url: createConstantRef(constantName, entryKey) });
  };

  return (
    <>
      {/* URL Mode selector (only if constants available) */}
      {urlConstants.length > 0 && (
        <div className='w-24'>
          <Label className='text-xs'>Mode</Label>
          <Select value={urlMode} onValueChange={(v) => handleModeChange(v as UrlMode)}>
            <SelectTrigger size='sm'>
              <SelectValue placeholder='Select' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='literal'>Literal</SelectItem>
              <SelectItem value='constant'>Constant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* URL field - literal mode */}
      {urlMode === 'literal' && (
        <div className='w-48'>
          <Label className='text-xs'>URL</Label>
          <Input
            className='h-8 text-sm'
            placeholder='https://... or PDB ID'
            value={literalUrl}
            onChange={(e) => onDownloadChange({ ...downloadNode.params, url: e.target.value })}
          />
        </div>
      )}

      {/* URL field - constant mode */}
      {urlMode === 'constant' && (
        <div className='w-48'>
          <Label className='text-xs'>URL Constant</Label>
          <Select
            value={currentConstantValue}
            onValueChange={(v) => {
              const [constName, entryKey] = v.split(':');
              handleConstantRefChange(constName, entryKey);
            }}
          >
            <SelectTrigger size='sm'>
              <SelectValue placeholder='Select constant' />
            </SelectTrigger>
            <SelectContent>
              {constantOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className='flex flex-col'>
                    <span>{opt.label}</span>
                    <span className='text-xs text-muted-foreground'>{opt.preview}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {constantOptions.length === 0 && (
            <p className='text-xs text-muted-foreground mt-1'>No URL constants defined.</p>
          )}
        </div>
      )}

      {/* Format field */}
      <div className='w-24'>
        <Label className='text-xs'>Format</Label>
        <Select value={format} onValueChange={(value) => onParseChange({ ...parseNode.params, format: value })}>
          <SelectTrigger size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activeFormats.map((fmt) => (
              <SelectItem key={fmt.value} value={fmt.value}>
                {fmt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Single ref field */}
      <div className='w-24'>
        <Label className='text-xs'>Ref</Label>
        <Input
          className='h-8 text-sm'
          placeholder='name'
          value={ref}
          onChange={(e) => onRefChange(e.target.value)}
          title='Reference name (parse node gets "Parse" suffix)'
        />
      </div>
    </>
  );
}
