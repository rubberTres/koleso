export const FENDER_CLEARANCE_FROM_BASE_OUTER = 5;

export function getFenderPosition(baseOuterEdge: number): number {
  return baseOuterEdge + FENDER_CLEARANCE_FROM_BASE_OUTER;
}
