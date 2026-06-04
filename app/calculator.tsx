"use client";

import { useMemo, useState } from "react";
import { Card, Chip, Label, NumberField, Slider } from "@heroui/react";
import { FrontView } from "./components/front-view";
import { TireInput } from "./components/tire-input";
import { TireVerdict } from "./components/tire-verdict";
import { TopView } from "./components/top-view";
import { calcTire, formatTireSize } from "@/lib/tire-calc";
import {
  BASE_PRESET,
  calcWheel,
  compareWheels,
  type WheelCalc,
  type WheelSpec,
} from "@/lib/wheel-presets";

const WHEEL_DEFAULTS: WheelSpec = {
  diameter: 17,
  width: 9,
  et: 35,
  spacer: 0,
};

const TIRE_DEFAULTS = { width: 235, profile: 40 };

type Props = {
  baseCalc: WheelCalc;
};

export function Calculator({ baseCalc }: Props) {
  const [spec, setSpec] = useState<WheelSpec>(WHEEL_DEFAULTS);
  const [tireEnabled, setTireEnabled] = useState(false);
  const [tireSpec, setTireSpec] = useState(TIRE_DEFAULTS);

  const current = useMemo(() => calcWheel(spec), [spec]);
  const cmp = useMemo(() => compareWheels(current, baseCalc), [current, baseCalc]);
  const tire = useMemo(() => {
    if (!tireEnabled) return undefined;
    return calcTire(
      { width: tireSpec.width, profile: tireSpec.profile, rimDiameter: spec.diameter },
      spec.width,
    );
  }, [tireEnabled, tireSpec, spec.diameter, spec.width]);

  const update = (key: keyof WheelSpec) => (v: number) =>
    setSpec((s) => ({ ...s, [key]: Number.isNaN(v) ? 0 : v }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <Card.Header>
              <Card.Title>
                <span className="text-muted font-mono text-[11px] tracking-widest uppercase">
                  Base preset
                </span>
                <div className="mt-1">{BASE_PRESET.name}</div>
              </Card.Title>
              <Card.Description>
                {BASE_PRESET.diameter}″ × {BASE_PRESET.width}″ ET{BASE_PRESET.et} +{" "}
                {BASE_PRESET.spacer}mm spacer
              </Card.Description>
            </Card.Header>
            <Card.Content className="grid gap-1 font-mono text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted">Effective offset</span>
                <span>{baseCalc.effectiveOffset.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Outer edge</span>
                <span>{baseCalc.outerEdge.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Inner edge</span>
                <span>{baseCalc.innerEdge.toFixed(1)} mm</span>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Twój set</Card.Title>
              <Card.Description>Wpisz parametry felgi i dystansu.</Card.Description>
            </Card.Header>
            <Card.Content className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Średnica (cale)"
                value={spec.diameter}
                step={0.5}
                minValue={10}
                maxValue={25}
                onChange={update("diameter")}
              />
              <Field
                label="Szerokość (cale)"
                value={spec.width}
                step={0.25}
                minValue={5}
                maxValue={14}
                onChange={update("width")}
              />
              <Field
                label="ET (mm)"
                value={spec.et}
                step={1}
                minValue={-50}
                maxValue={80}
                onChange={update("et")}
              />
              <Field
                label="Dystans (mm)"
                value={spec.spacer}
                step={1}
                minValue={0}
                maxValue={60}
                onChange={update("spacer")}
              />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Opona</Card.Title>
              <Card.Description>
                Włącz, żeby zobaczyć średnicę zewnętrzną i pasowanie do felgi.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <TireInput
                enabled={tireEnabled}
                onToggle={setTireEnabled}
                width={tireSpec.width}
                profile={tireSpec.profile}
                onWidthChange={(v) => setTireSpec((t) => ({ ...t, width: v }))}
                onProfileChange={(v) => setTireSpec((t) => ({ ...t, profile: v }))}
                sizeLabel={formatTireSize(tireSpec.width, tireSpec.profile, spec.diameter)}
              />
            </Card.Content>
          </Card>
        </div>

        <div className="grid gap-6 lg:col-span-3 xl:grid-cols-2">
          <Card>
            <Card.Header>
              <Card.Title>Widok od przodu</Card.Title>
              <Card.Description>
                Przekrój koła + profil błotnika. Clearance = jak daleko od lipu.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <FrontView baseCalc={baseCalc} currentSpec={spec} currentCalc={current} tire={tire} />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Widok z góry</Card.Title>
              <Card.Description>
                Koło w wycięciu nadwozia. Linia warning = lico stocku.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <TopView
                baseSpec={BASE_PRESET}
                baseCalc={baseCalc}
                currentSpec={spec}
                currentCalc={current}
                tire={tire}
              />
            </Card.Content>
          </Card>
        </div>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Wynik</Card.Title>
          <Card.Description>
            {spec.diameter}″ × {spec.width}″ ET{spec.et}
            {spec.spacer > 0 ? ` + ${spec.spacer}mm spacer` : ""}
            {tire ? ` · ${formatTireSize(tireSpec.width, tireSpec.profile, spec.diameter)}` : ""}
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid gap-6 font-mono text-sm sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-muted text-[10px] font-medium tracking-widest uppercase">
                Felga
              </div>
              <Row label="Effective offset" value={`${current.effectiveOffset.toFixed(1)} mm`} />
              <Row
                label="Outer edge"
                value={`${current.outerEdge.toFixed(1)} mm`}
                delta={cmp.outerDelta}
              />
              <Row
                label="Inner edge"
                value={`${current.innerEdge.toFixed(1)} mm`}
                delta={cmp.innerDelta}
              />
            </div>
            {tire && (
              <div className="space-y-2">
                <div className="text-muted text-[10px] font-medium tracking-widest uppercase">
                  Opona
                </div>
                <Row
                  label="Rozmiar"
                  value={formatTireSize(tireSpec.width, tireSpec.profile, spec.diameter)}
                />
                <Row label="Średnica zewn." value={`${tire.overallDiameter.toFixed(1)} mm`} />
                <Row label="Sidewall" value={`${tire.sidewallHeight.toFixed(1)} mm`} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Verdict outerDelta={cmp.outerDelta} />
            {tire && <TireVerdict tire={tire} />}
          </div>
        </Card.Content>
      </Card>

      {/* TODO: input pociągnięcia błotnika (overfender mm) */}
      {/* TODO: autocomplete popularnych rozmiarów opon */}
      {/* TODO: speedometer error calc (różnica ⌀ vs base) */}
      {/* TODO: camber slider — rotacja koła w nadkolu */}
      {/* TODO: eksport PDF */}
    </div>
  );
}

function Field({
  label,
  value,
  step,
  minValue,
  maxValue,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  minValue: number;
  maxValue: number;
  onChange: (v: number) => void;
}) {
  const clamped = Math.min(Math.max(value, minValue), maxValue);
  return (
    <div className="space-y-3">
      <NumberField
        value={value}
        onChange={onChange}
        step={step}
        minValue={minValue}
        maxValue={maxValue}
      >
        <Label>{label}</Label>
        <NumberField.Group>
          <NumberField.DecrementButton>−</NumberField.DecrementButton>
          <NumberField.Input />
          <NumberField.IncrementButton>+</NumberField.IncrementButton>
        </NumberField.Group>
      </NumberField>
      <Slider
        value={clamped}
        onChange={(v) => onChange(typeof v === "number" ? v : v[0])}
        step={step}
        minValue={minValue}
        maxValue={maxValue}
        aria-label={label}
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
    </div>
  );
}

function Row({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const deltaClass =
    delta === undefined
      ? ""
      : delta > 0
        ? "text-warning"
        : delta < 0
          ? "text-accent"
          : "text-muted";

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <span>{value}</span>
        {delta !== undefined && (
          <span className={`text-xs ${deltaClass}`}>
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} mm
          </span>
        )}
      </span>
    </div>
  );
}

function Verdict({ outerDelta }: { outerDelta: number }) {
  const formatted = `${outerDelta > 0 ? "+" : ""}${outerDelta.toFixed(1)} mm`;

  if (Math.abs(outerDelta) <= 3) {
    return <Chip color="success">Praktycznie identyczne lico</Chip>;
  }
  if (outerDelta < -3) {
    return <Chip color="accent">Schowane ({formatted}) — tucked look</Chip>;
  }
  if (outerDelta <= 10) {
    return (
      <Chip color="warning" variant="soft">
        Lekko wystaje ({formatted})
      </Chip>
    );
  }
  if (outerDelta <= 25) {
    return (
      <Chip color="warning" variant="primary">
        Mocno wystaje ({formatted}) — sprawdź błotnik
      </Chip>
    );
  }
  return <Chip color="danger">Wystaje ({formatted}) — wymaga overfenderów</Chip>;
}
