"use client";

import { getFenderPosition } from "@/lib/fender-config";
import type { TireCalc } from "@/lib/tire-calc";
import type { WheelCalc, WheelSpec } from "@/lib/wheel-presets";

type Props = {
  baseSpec: WheelSpec;
  baseCalc: WheelCalc;
  currentSpec: WheelSpec;
  currentCalc: WheelCalc;
  tire?: TireCalc;
};

export function TopView({ baseSpec, baseCalc, currentSpec, currentCalc, tire }: Props) {
  const xc = currentCalc.effectiveOffset;
  const feldaHalfW = (currentSpec.width * 25.4) / 2;
  const rimRadius = (currentSpec.diameter * 25.4) / 2;
  const tireHalfW = tire ? tire.treadWidth / 2 : feldaHalfW;
  const overallRadius = tire ? tire.overallDiameter / 2 : rimRadius;

  const baseRimRadius = (baseSpec.diameter * 25.4) / 2;
  const archHalfH = baseRimRadius + 28;
  const fenderOuterX = -getFenderPosition(baseCalc.outerEdge);
  const archInnerX = baseCalc.innerEdge + 14;

  const baseRefX = -baseCalc.outerEdge;
  const currentOuterX = Math.min(xc - feldaHalfW, xc - tireHalfW);
  const currentInnerX = Math.max(xc + feldaHalfW, xc + tireHalfW);

  const padX = 90;
  const padY = 80;
  const leftX = Math.min(fenderOuterX, currentOuterX, baseRefX) - padX;
  const rightX = Math.max(archInnerX, currentInnerX) + padX + 30;
  const topY = -archHalfH - padY;
  const bottomY = archHalfH + padY;

  const bodyTopExtent = topY + 28;
  const bodyBottomExtent = bottomY - 32;
  const bodyInnerX = rightX - 28;
  const archCornerR = 12;

  const bodyPath = `
    M ${fenderOuterX} ${bodyTopExtent}
    L ${bodyInnerX} ${bodyTopExtent}
    L ${bodyInnerX} ${bodyBottomExtent}
    L ${fenderOuterX} ${bodyBottomExtent}
    L ${fenderOuterX} ${archHalfH + archCornerR}
    Q ${fenderOuterX} ${archHalfH} ${fenderOuterX + archCornerR} ${archHalfH}
    L ${archInnerX - archCornerR} ${archHalfH}
    Q ${archInnerX} ${archHalfH} ${archInnerX} ${archHalfH - archCornerR}
    L ${archInnerX} ${-archHalfH + archCornerR}
    Q ${archInnerX} ${-archHalfH} ${archInnerX - archCornerR} ${-archHalfH}
    L ${fenderOuterX + archCornerR} ${-archHalfH}
    Q ${fenderOuterX} ${-archHalfH} ${fenderOuterX} ${-archHalfH - archCornerR}
    Z
  `;

  return (
    <svg
      viewBox={`${leftX} ${topY} ${rightX - leftX} ${bottomY - topY}`}
      className="h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <text
        x={(leftX + rightX) / 2}
        y={topY + 18}
        textAnchor="middle"
        className="fill-muted font-mono text-[11px] tracking-widest uppercase"
      >
        ↑ przód auta
      </text>
      <text
        x={(leftX + rightX) / 2}
        y={bottomY - 8}
        textAnchor="middle"
        className="fill-muted font-mono text-[11px] tracking-widest uppercase"
      >
        tył auta ↓
      </text>

      <path
        d={bodyPath}
        fill="currentColor"
        fillOpacity={0.05}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        className="text-foreground opacity-70"
      />
      <text
        x={bodyInnerX - 8}
        y={bodyTopExtent + 16}
        textAnchor="end"
        className="fill-muted font-mono text-[10px] tracking-widest uppercase"
      >
        nadwozie
      </text>
      <text
        x={fenderOuterX + 8}
        y={-archHalfH - 8}
        className="fill-muted font-mono text-[10px] tracking-widest uppercase"
      >
        wycięcie nadkola
      </text>

      {tire && (
        <rect
          x={xc - tireHalfW}
          y={-overallRadius}
          width={tireHalfW * 2}
          height={overallRadius * 2}
          fill="currentColor"
          fillOpacity={0.75}
          stroke="none"
          className="text-foreground"
          rx={8}
        />
      )}

      <rect
        x={xc - feldaHalfW}
        y={-rimRadius}
        width={feldaHalfW * 2}
        height={rimRadius * 2}
        fill="currentColor"
        fillOpacity={0.06}
        stroke="currentColor"
        strokeWidth={2}
        className="text-accent"
        rx={4}
      />

      <g className="text-foreground">
        <line x1={-8} x2={8} y1={0} y2={0} stroke="currentColor" strokeWidth={1.5} />
        <line x1={0} x2={0} y1={-8} y2={8} stroke="currentColor" strokeWidth={1.5} />
        <circle cx={0} cy={0} r={3} fill="currentColor" />
      </g>

      <line
        x1={baseRefX}
        x2={baseRefX}
        y1={bodyTopExtent + 6}
        y2={bodyBottomExtent - 6}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="6 4"
        className="text-warning opacity-80"
      />
      <line
        x1={baseRefX - 10}
        x2={baseRefX + 10}
        y1={bodyTopExtent + 6}
        y2={bodyTopExtent + 6}
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-warning"
      />
      <line
        x1={baseRefX - 10}
        x2={baseRefX + 10}
        y1={bodyBottomExtent - 6}
        y2={bodyBottomExtent - 6}
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-warning"
      />
      <rect
        x={baseRefX - 28}
        y={topY + 36}
        width={56}
        height={18}
        rx={3}
        fill="currentColor"
        fillOpacity={0.2}
        className="text-warning"
      />
      <text
        x={baseRefX}
        y={topY + 48}
        textAnchor="middle"
        className="fill-warning font-mono text-[11px] font-semibold tracking-widest uppercase"
      >
        base
      </text>

      <text
        x={currentOuterX - 12}
        y={5}
        textAnchor="end"
        className="fill-muted font-mono text-[10px] tracking-widest uppercase"
      >
        ← outer
      </text>
      <text
        x={currentInnerX + 12}
        y={5}
        className="fill-muted font-mono text-[10px] tracking-widest uppercase"
      >
        inner →
      </text>

      <g className="font-mono">
        <text x={leftX + 12} y={topY + 50} className="fill-foreground text-[11px]">
          szer: {(currentSpec.width * 25.4).toFixed(1)} mm
        </text>
        {tire && (
          <text x={leftX + 12} y={topY + 66} className="fill-foreground text-[11px]">
            ⌀ {tire.overallDiameter.toFixed(1)} mm
          </text>
        )}
      </g>
    </svg>
  );
}
