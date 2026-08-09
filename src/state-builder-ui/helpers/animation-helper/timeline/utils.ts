export function toVec3(v: number[] | null | undefined, fallback: [number, number, number]): [number, number, number] {
  return (Array.isArray(v) && v.length === 3) ? v as [number, number, number] : fallback;
}
