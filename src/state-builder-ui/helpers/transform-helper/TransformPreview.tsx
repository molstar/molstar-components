'use client';

import { useMemo } from 'react';
import { mulMat3Vec3, projectIsometric, IDENTITY_3x3 } from '../../../state-builder/index.ts';
import type { Vec3 } from '../../../state-builder/index.ts';
import type { TransformPreviewProps } from './types.ts';

// Unit cube vertices centered at origin
const CUBE_VERTICES: Vec3[] = [
  [-0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5],
  [0.5, 0.5, -0.5],
  [-0.5, 0.5, -0.5],
  [-0.5, -0.5, 0.5],
  [0.5, -0.5, 0.5],
  [0.5, 0.5, 0.5],
  [-0.5, 0.5, 0.5],
];

// Cube edge pairs (vertex index pairs)
const CUBE_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0], // back face
  [4, 5], [5, 6], [6, 7], [7, 4], // front face
  [0, 4], [1, 5], [2, 6], [3, 7], // connecting edges
];

// Axis arrows (from origin)
const AXIS_LENGTH = 0.9;
const AXES: { dir: Vec3; color: string; label: string }[] = [
  { dir: [AXIS_LENGTH, 0, 0], color: '#ef4444', label: 'X' },
  { dir: [0, AXIS_LENGTH, 0], color: '#22c55e', label: 'Y' },
  { dir: [0, 0, AXIS_LENGTH], color: '#3b82f6', label: 'Z' },
];

const SIZE = 180;
const CENTER = SIZE / 2;
const SCALE = 70;

export function TransformPreview({ rotation, translation }: TransformPreviewProps) {
  const mat = rotation.length === 9 ? rotation : IDENTITY_3x3;

  const projected = useMemo(() => {
    // Transform and project cube vertices
    const cubePoints = CUBE_VERTICES.map((v) => {
      const rotated = mulMat3Vec3(mat, v);
      const [px, py] = projectIsometric(rotated);
      return [CENTER + px * SCALE, CENTER + py * SCALE] as [number, number];
    });

    // Transform and project axis endpoints
    const origin: Vec3 = [0, 0, 0];
    const [ox, oy] = projectIsometric(origin);
    const originScreen = [CENTER + ox * SCALE, CENTER + oy * SCALE] as [number, number];

    const axisPoints = AXES.map((axis) => {
      const rotated = mulMat3Vec3(mat, axis.dir);
      const [px, py] = projectIsometric(rotated);
      return {
        end: [CENTER + px * SCALE, CENTER + py * SCALE] as [number, number],
        color: axis.color,
        label: axis.label,
      };
    });

    return { cubePoints, originScreen, axisPoints };
  }, [mat]);

  // Translation indicator text
  const hasTranslation = translation.some((v) => v !== 0);
  const translationLabel = hasTranslation
    ? `T: [${translation.map((v) => v.toFixed(1)).join(', ')}]`
    : '';

  return (
    <div className='flex flex-col items-center'>
      <svg width={SIZE} height={SIZE} className='border rounded bg-muted/30'>
        {/* Cube edges */}
        {CUBE_EDGES.map(([i, j], idx) => (
          <line
            key={`edge-${idx}`}
            x1={projected.cubePoints[i][0]}
            y1={projected.cubePoints[i][1]}
            x2={projected.cubePoints[j][0]}
            y2={projected.cubePoints[j][1]}
            stroke='currentColor'
            strokeOpacity={0.3}
            strokeWidth={1}
          />
        ))}

        {/* Axis arrows */}
        {projected.axisPoints.map((axis, idx) => (
          <g key={`axis-${idx}`}>
            <line
              x1={projected.originScreen[0]}
              y1={projected.originScreen[1]}
              x2={axis.end[0]}
              y2={axis.end[1]}
              stroke={axis.color}
              strokeWidth={2}
              strokeLinecap='round'
            />
            <text
              x={axis.end[0]}
              y={axis.end[1]}
              dx={4}
              dy={-4}
              fill={axis.color}
              fontSize={10}
              fontWeight='bold'
            >
              {axis.label}
            </text>
          </g>
        ))}

        {/* Origin dot */}
        <circle
          cx={projected.originScreen[0]}
          cy={projected.originScreen[1]}
          r={2}
          fill='currentColor'
          opacity={0.5}
        />
      </svg>

      {translationLabel && (
        <span className='text-xs text-muted-foreground mt-1 font-mono'>{translationLabel}</span>
      )}
    </div>
  );
}
