"use client";

import { Label, NumberField, Slider, Switch } from "@heroui/react";

type Props = {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  width: number;
  profile: number;
  onWidthChange: (v: number) => void;
  onProfileChange: (v: number) => void;
  sizeLabel: string;
};

export function TireInput({
  enabled,
  onToggle,
  width,
  profile,
  onWidthChange,
  onProfileChange,
  sizeLabel,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-medium">Dodaj oponę</div>
          <div className="text-muted font-mono text-xs tracking-wide">
            {enabled ? sizeLabel : "— wyłączone"}
          </div>
        </div>
        <Switch isSelected={enabled} onChange={onToggle}>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      {enabled && (
        <div className="grid gap-5 sm:grid-cols-2">
          <TireField
            label="Szerokość (mm)"
            value={width}
            step={5}
            minValue={145}
            maxValue={355}
            onChange={onWidthChange}
          />
          <TireField
            label="Profil (%)"
            value={profile}
            step={5}
            minValue={25}
            maxValue={80}
            onChange={onProfileChange}
          />
        </div>
      )}
    </div>
  );
}

function TireField({
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
        onChange={(v) => onChange(Number.isNaN(v) ? minValue : v)}
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
