// src/state-builder/types/_lib.ts
//
// Inlined from @mol-view-stories/lib to avoid cross-repo dependency.
// CameraData + adjustedCameraPosition were the only imports from lib
// needed by state-builder.

import { Vec3 } from 'molstar/lib/mol-math/linear-algebra.js';

export type CameraData = {
  mode: 'perspective' | 'orthographic';
  target: [number, number, number] | Vec3;
  position: [number, number, number] | Vec3;
  up: [number, number, number] | Vec3;
  fov: number;
};

export function adjustedCameraPosition(camera: CameraData): [number, number, number] {
  // MVS uses FOV-adjusted camera position; apply inverse so it does not
  // offset the view when loaded back into the viewer.
  const f =
    camera.mode === 'orthographic'
      ? 1 / (2 * Math.tan(camera.fov / 2))
      : 1 / (2 * Math.sin(camera.fov / 2));
  const delta = Vec3.sub(Vec3(), camera.position as Vec3, camera.target as Vec3);
  return Vec3.scaleAndAdd(Vec3(), camera.target as Vec3, delta, 1 / f) as unknown as [number, number, number];
}
