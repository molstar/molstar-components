'use client';

import { useMemo } from 'react';
import { projectIsometric } from '../../../state-builder/index.ts';
import type { Vec3 } from '../../../state-builder/index.ts';
import type { CameraPreviewProps } from './types.ts';

const SIZE = 180;
const CENTER = SIZE / 2;

export function CameraPreview({ position, target }: CameraPreviewProps) {
  const projected = useMemo(() => {
    // Normalize positions to fit the SVG
    const dx = position[0] - target[0];
    const dy = position[1] - target[1];
    const dz = position[2] - target[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    // Scale factor to keep everything within the SVG bounds
    const scale = 60 / Math.max(dist, 1);

    const posNorm: Vec3 = [(position[0] - target[0]) * scale, (position[1] - target[1]) * scale, (position[2] - target[2]) * scale];
    const targetNorm: Vec3 = [0, 0, 0];

    const [px, py] = projectIsometric(posNorm);
    const [tx, ty] = projectIsometric(targetNorm);

    // Axis arrows (short, centered on target)
    const axisLen = 25;
    const axes = [
      { dir: [axisLen, 0, 0] as Vec3, color: '#ef4444', label: 'X' },
      { dir: [0, axisLen, 0] as Vec3, color: '#22c55e', label: 'Y' },
      { dir: [0, 0, axisLen] as Vec3, color: '#3b82f6', label: 'Z' },
    ].map((a) => {
      const [ax, ay] = projectIsometric(a.dir);
      return { x: CENTER + ax, y: CENTER + ay, color: a.color, label: a.label };
    });

    return {
      cam: { x: CENTER + px, y: CENTER + py },
      tgt: { x: CENTER + tx, y: CENTER + ty },
      axes,
    };
  }, [position, target]);

  return (
    <div className='flex flex-col items-center'>
      <svg width={SIZE} height={SIZE} className='border rounded bg-muted/30'>
        {/* Axis arrows from target */}
        {projected.axes.map((axis) => (
          <g key={axis.label}>
            <line
              x1={projected.tgt.x} y1={projected.tgt.y}
              x2={axis.x} y2={axis.y}
              stroke={axis.color} strokeWidth={1.5} strokeOpacity={0.4} strokeLinecap='round'
            />
            <text x={axis.x} y={axis.y} dx={3} dy={-3} fill={axis.color} fontSize={9} fontWeight='bold'>
              {axis.label}
            </text>
          </g>
        ))}

        {/* Direction line: camera -> target */}
        <line
          x1={projected.cam.x} y1={projected.cam.y}
          x2={projected.tgt.x} y2={projected.tgt.y}
          stroke='currentColor' strokeWidth={1.5} strokeDasharray='4 2' strokeOpacity={0.5}
        />

        {/* Target crosshair */}
        <circle cx={projected.tgt.x} cy={projected.tgt.y} r={4} fill='none' stroke='currentColor' strokeWidth={1.5} />
        <line x1={projected.tgt.x - 6} y1={projected.tgt.y} x2={projected.tgt.x + 6} y2={projected.tgt.y} stroke='currentColor' strokeWidth={1} />
        <line x1={projected.tgt.x} y1={projected.tgt.y - 6} x2={projected.tgt.x} y2={projected.tgt.y + 6} stroke='currentColor' strokeWidth={1} />

        {/* Camera dot */}
        <circle cx={projected.cam.x} cy={projected.cam.y} r={5} fill='#3b82f6' stroke='white' strokeWidth={1.5} />

        {/* Labels */}
        <text x={projected.cam.x + 8} y={projected.cam.y + 4} fill='#3b82f6' fontSize={10} fontWeight='bold'>
          Cam
        </text>
      </svg>
    </div>
  );
}
