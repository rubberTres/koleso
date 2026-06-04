export const BASE_PRESET = {
  name: "Stock S13 setup",
  diameter: 18,
  width: 8.75,
  et: 35,
  spacer: 50,
} as const;

export type WheelSpec = {
  diameter: number;
  width: number;
  et: number;
  spacer: number;
};

export type WheelCalc = {
  halfWidthMm: number;
  effectiveOffset: number;
  outerEdge: number;
  innerEdge: number;
};

export type Comparison = {
  outerDelta: number;
  innerDelta: number;
};

export function calcWheel(spec: WheelSpec): WheelCalc {
  const halfWidthMm = (spec.width * 25.4) / 2;
  const effectiveOffset = spec.et - spec.spacer;
  return {
    halfWidthMm,
    effectiveOffset,
    outerEdge: halfWidthMm - effectiveOffset,
    innerEdge: halfWidthMm + effectiveOffset,
  };
}

export function compareWheels(current: WheelCalc, base: WheelCalc): Comparison {
  return {
    outerDelta: current.outerEdge - base.outerEdge,
    innerDelta: current.innerEdge - base.innerEdge,
  };
}
