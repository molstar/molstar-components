'use client';

import { useMemo } from 'react';
import { projectIsometric } from '../../../state-builder/index.ts';
import type { Vec3 } from '../../../state-builder/index.ts';

const SIZE = 180;
const CENTER = SIZE / 2;
const SCALE = 60;
const UP_LEN = 22;

function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

export interface FocusPreviewProps {
  direction: [number, number, number] | undefined;
  up: [number, number, number] | undefined;
}

export function FocusPreview({ direction, up }: FocusPreviewProps) {
  const projected = useMemo(() => {
    const isAuto = direction === undefined;
    const dir = direction ? normalize(direction) : [0, 0, -1] as [number, number, number];
    const upVec = up ? normalize(up) : [0, 1, 0] as [number, number, number];

    // Camera sits behind the target along -direction
    const camWorld: Vec3 = [-dir[0] * SCALE, -dir[1] * SCALE, -dir[2] * SCALE];
    const [cx, cy] = projectIsometric(camWorld);

    // Up arrow tip (only when up is explicitly set)
    const upTipWorld: Vec3 = [
      camWorld[0] + upVec[0] * UP_LEN,
      camWorld[1] + upVec[1] * UP_LEN,
      camWorld[2] + upVec[2] * UP_LEN,
    ];
    const [ux, uy] = projectIsometric(upTipWorld);

    const axisLen = 25;
    const axes = [
      { vec: [axisLen, 0, 0] as Vec3, color: '#ef4444', label: 'X' },
      { vec: [0, axisLen, 0] as Vec3, color: '#22c55e', label: 'Y' },
      { vec: [0, 0, axisLen] as Vec3, color: '#3b82f6', label: 'Z' },
    ].map((a) => {
      const [ax, ay] = projectIsometric(a.vec);
      return { x: CENTER + ax, y: CENTER + ay, color: a.color, label: a.label };
    });

    return {
      cam: { x: CENTER + cx, y: CENTER + cy },
      upTip: { x: CENTER + ux, y: CENTER + uy },
      axes,
      isAuto,
      showUp: up !== undefined,
    };
  }, [direction, up]);

  return (
    <div className='flex flex-col items-center gap-1'>
      <svg width={SIZE} height={SIZE} className='border rounded bg-muted/30'>
        {/* XYZ axis arrows from origin */}
        {projected.axes.map((axis) => (
          <g key={axis.label}>
            <line
              x1={CENTER} y1={CENTER}
              x2={axis.x} y2={axis.y}
              stroke={axis.color} strokeWidth={1.5} strokeOpacity={0.35} strokeLinecap='round'
            />
            <text x={axis.x} y={axis.y} dx={3} dy={-3} fill={axis.color} fontSize={9} fontWeight='bold' fillOpacity={0.6}>
              {axis.label}
            </text>
          </g>
        ))}

        {/* Target sphere */}
        <circle cx={CENTER} cy={CENTER} r={13} fill='none' stroke='currentColor' strokeWidth={1.5} strokeOpacity={0.5} />
        <circle cx={CENTER} cy={CENTER} r={2} fill='currentColor' fillOpacity={0.5} />

        {projected.isAuto ? (
          <text x={CENTER} y={CENTER + 28} textAnchor='middle' fill='currentColor' fontSize={10} fillOpacity={0.45}>
            auto
          </text>
        ) : (
          <>
            {/* Dashed sightline: eye → target */}
            <line
              x1={projected.cam.x} y1={projected.cam.y}
              x2={CENTER} y2={CENTER}
              stroke='currentColor' strokeWidth={1.5} strokeDasharray='4 2' strokeOpacity={0.45}
            />

            {/* Up arrow (amber) — only when up is explicitly set */}
            {projected.showUp && (
              <line
                x1={projected.cam.x} y1={projected.cam.y}
                x2={projected.upTip.x} y2={projected.upTip.y}
                stroke='#f59e0b' strokeWidth={2} strokeLinecap='round'
              />
            )}

            {/* Eye dot */}
            <circle cx={projected.cam.x} cy={projected.cam.y} r={5} fill='#3b82f6' stroke='white' strokeWidth={1.5} />
            <text x={projected.cam.x + 8} y={projected.cam.y + 4} fill='#3b82f6' fontSize={10} fontWeight='bold'>
              Eye
            </text>
          </>
        )}
      </svg>

      <p className='text-xs text-muted-foreground'>
        {projected.isAuto ? 'Auto (MVS default)' : 'Direction preview'}
      </p>
    </div>
  );
}
