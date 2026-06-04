"use client";

import { getFenderPosition } from "@/lib/fender-config";
import type { TireCalc } from "@/lib/tire-calc";
import type { WheelCalc, WheelSpec } from "@/lib/wheel-presets";

type Props = {
  baseCalc: WheelCalc;
  currentSpec: WheelSpec;
  currentCalc: WheelCalc;
  tire?: TireCalc;
};

export function FrontView({ baseCalc, currentSpec, currentCalc, tire }: Props) {
  const rimRadius = (currentSpec.diameter * 25.4) / 2;
  const feldaHalfW = (currentSpec.width * 25.4) / 2;
  const xc = currentCalc.effectiveOffset;

  const tireHalfW = tire ? tire.treadWidth / 2 : feldaHalfW;
  const overallRadius = tire ? tire.overallDiameter / 2 : rimRadius;

  const currentOuterX = Math.min(xc - feldaHalfW, xc - tireHalfW);
  const currentInnerX = Math.max(xc + feldaHalfW, xc + tireHalfW);

  const fenderDistance = getFenderPosition(baseCalc.outerEdge);
  const fenderX = -fenderDistance;
  const clearanceMm = fenderDistance - -currentOuterX;

  const baseRefX = -baseCalc.outerEdge;

  const padX = 80;
  const padTop = 90;
  const padBottom = 60;
  const fenderInnerEndX = Math.max(currentInnerX, baseCalc.innerEdge) + 40;
  const leftX = Math.min(fenderX, currentOuterX, baseRefX) - padX;
  const rightX = fenderInnerEndX + padX;
  const topY = -overallRadius - padTop;
  const bottomY = overallRadius + padBottom;
  const groundY = overallRadius;

  const fenderLipY = -overallRadius - 6;
  const fenderPeakHeight = Math.max(50, overallRadius * 0.14);
  const fenderPeakY = fenderLipY - fenderPeakHeight;
  const cornerR = Math.min(22, fenderPeakHeight * 0.4);

  const clearanceY = -overallRadius - 26;
  const clearanceOK = clearanceMm >= 0;
  const clearanceColor = clearanceOK ? "var(--color-success)" : "var(--color-danger)";
  const clearanceLabel = clearanceOK
    ? `+${clearanceMm.toFixed(1)} mm clearance`
    : `${clearanceMm.toFixed(1)} mm wystaje`;

  return (
    <svg
      viewBox={`${leftX} ${topY} ${rightX - leftX} ${bottomY - topY}`}
      className="h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={rightX - 25}
        x2={rightX - 25}
        y1={topY + 20}
        y2={groundY + 5}
        stroke="currentColor"
        strokeWidth={0.8}
        strokeDasharray="3 5"
        className="text-separator"
      />
      <text
        x={rightX - 20}
        y={topY + 30}
        className="fill-muted font-mono text-[10px] tracking-wider uppercase"
      >
        oś auta
      </text>

      <line
        x1={leftX + 15}
        x2={rightX - 35}
        y1={groundY}
        y2={groundY}
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-foreground opacity-30"
      />

      <path
        d={`M ${fenderX} ${fenderLipY}
            L ${fenderX} ${fenderPeakY + cornerR}
            Q ${fenderX} ${fenderPeakY} ${fenderX + cornerR} ${fenderPeakY}
            L ${fenderInnerEndX - cornerR} ${fenderPeakY}
            Q ${fenderInnerEndX} ${fenderPeakY} ${fenderInnerEndX} ${fenderPeakY + cornerR}
            L ${fenderInnerEndX} ${groundY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground opacity-70"
      />
      <text
        x={(fenderX + fenderInnerEndX) / 2}
        y={fenderPeakY - 10}
        textAnchor="middle"
        className="fill-muted font-mono text-[10px] tracking-widest uppercase"
      >
        błotnik / nadwozie
      </text>

      {tire && (
        <g className="text-foreground">
          <path
            d={`M ${xc - tireHalfW} ${-overallRadius}
                L ${xc + tireHalfW} ${-overallRadius}
                L ${xc + feldaHalfW} ${-rimRadius}
                L ${xc - feldaHalfW} ${-rimRadius} Z`}
            fill="currentColor"
            fillOpacity={0.78}
            stroke="currentColor"
            strokeWidth={1}
          />
          <path
            d={`M ${xc - feldaHalfW} ${rimRadius}
                L ${xc + feldaHalfW} ${rimRadius}
                L ${xc + tireHalfW} ${overallRadius}
                L ${xc - tireHalfW} ${overallRadius} Z`}
            fill="currentColor"
            fillOpacity={0.78}
            stroke="currentColor"
            strokeWidth={1}
          />
        </g>
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
        rx={3}
      />

      <g className="text-foreground">
        <line x1={-8} x2={8} y1={0} y2={0} stroke="currentColor" strokeWidth={1.5} />
        <line x1={0} x2={0} y1={-8} y2={8} stroke="currentColor" strokeWidth={1.5} />
        <circle cx={0} cy={0} r={3} fill="currentColor" />
      </g>

      <line
        x1={baseRefX}
        x2={baseRefX}
        y1={fenderPeakY - 10}
        y2={groundY + 25}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="6 4"
        className="text-warning opacity-80"
      />
      <rect
        x={baseRefX - 32}
        y={groundY + 32}
        width={64}
        height={16}
        rx={3}
        fill="currentColor"
        fillOpacity={0.18}
        className="text-warning"
      />
      <text
        x={baseRefX}
        y={groundY + 43}
        textAnchor="middle"
        className="fill-warning font-mono text-[11px] font-semibold tracking-widest uppercase"
      >
        base lico
      </text>

      <g style={{ color: clearanceColor }} className="text-success">
        <line
          x1={fenderX}
          x2={currentOuterX}
          y1={clearanceY}
          y2={clearanceY}
          stroke="currentColor"
          strokeWidth={2}
        />
        <line
          x1={fenderX}
          x2={fenderX}
          y1={clearanceY - 6}
          y2={clearanceY + 6}
          stroke="currentColor"
          strokeWidth={2}
        />
        <line
          x1={currentOuterX}
          x2={currentOuterX}
          y1={clearanceY - 6}
          y2={clearanceY + 6}
          stroke="currentColor"
          strokeWidth={2}
        />
        <text
          x={(fenderX + currentOuterX) / 2}
          y={clearanceY - 12}
          textAnchor="middle"
          fill="currentColor"
          className="font-mono text-[11px] font-medium"
        >
          {clearanceLabel}
        </text>
      </g>

      <text
        x={currentOuterX - 10}
        y={groundY + 18}
        textAnchor="end"
        className="fill-muted font-mono text-[10px] tracking-wider uppercase"
      >
        ← outer
      </text>
      <text
        x={currentInnerX + 10}
        y={groundY + 18}
        className="fill-muted font-mono text-[10px] tracking-wider uppercase"
      >
        inner →
      </text>

      {tire && (
        <text
          x={xc}
          y={bottomY - 12}
          textAnchor="middle"
          className="fill-foreground font-mono text-[11px]"
        >
          ⌀ {tire.overallDiameter.toFixed(1)} mm
        </text>
      )}
    </svg>
  );
}
