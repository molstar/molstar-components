'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../base/select.tsx';
import { Label } from '../../base/label.tsx';
import { PRIMITIVE_KINDS } from '../../../state-builder/index.ts';
import type { PrimitiveKind } from '../../../state-builder/index.ts';
import type { PrimitiveKindFieldsProps } from './types.ts';
import { AngleFields } from './AngleFields.tsx';
import { ArrowFields } from './ArrowFields.tsx';
import { BoxFields } from './BoxFields.tsx';
import { DistanceFields } from './DistanceFields.tsx';
import { EllipseFields } from './EllipseFields.tsx';
import { EllipsoidFields } from './EllipsoidFields.tsx';
import { LabelFields } from './LabelFields.tsx';
import { LinesFields } from './LinesFields.tsx';
import { MeshFields } from './MeshFields.tsx';
import { TubeFields } from './TubeFields.tsx';

function KindFields({ params, onUpdate }: PrimitiveKindFieldsProps) {
  switch (params.kind as PrimitiveKind) {
    case 'label':
      return <LabelFields params={params} onUpdate={onUpdate} />;
    case 'ellipsoid':
      return <EllipsoidFields params={params} onUpdate={onUpdate} />;
    case 'distance_measurement':
      return <DistanceFields params={params} onUpdate={onUpdate} />;
    case 'angle_measurement':
      return <AngleFields params={params} onUpdate={onUpdate} />;
    case 'arrow':
      return <ArrowFields params={params} onUpdate={onUpdate} />;
    case 'tube':
      return <TubeFields params={params} onUpdate={onUpdate} />;
    case 'box':
      return <BoxFields params={params} onUpdate={onUpdate} />;
    case 'ellipse':
      return <EllipseFields params={params} onUpdate={onUpdate} />;
    case 'mesh':
      return <MeshFields params={params} onUpdate={onUpdate} />;
    case 'lines':
      return <LinesFields params={params} onUpdate={onUpdate} />;
    default:
      return (
        <p className='text-xs text-muted-foreground'>
          No editor for kind <code>{String(params.kind)}</code>. Use the Raw tab.
        </p>
      );
  }
}

export function PrimitiveItemEditor({ params, onUpdate }: PrimitiveKindFieldsProps) {
  const currentKind = (params.kind as PrimitiveKind) ?? 'label';

  const handleKindChange = (kind: string) => {
    // Keep only non-kind-specific fields when switching kinds
    onUpdate({ kind });
  };

  return (
    <div className='space-y-4'>
      <div>
        <Label className='text-xs font-medium'>Kind</Label>
        <Select value={currentKind} onValueChange={handleKindChange}>
          <SelectTrigger className='h-8 text-sm mt-1'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIMITIVE_KINDS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <KindFields params={params} onUpdate={onUpdate} />
    </div>
  );
}
