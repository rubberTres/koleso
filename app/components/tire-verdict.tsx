"use client";

import { Chip } from "@heroui/react";
import type { TireCalc } from "@/lib/tire-calc";

export function TireVerdict({ tire }: { tire: TireCalc }) {
  if (!tire.fitsRim) {
    return <Chip color="danger">{tire.fitMessage}</Chip>;
  }
  if (tire.fitMessage === "Pasuje idealnie") {
    return <Chip color="success">{tire.fitMessage}</Chip>;
  }
  return (
    <Chip color="warning" variant="soft">
      {tire.fitMessage}
    </Chip>
  );
}
