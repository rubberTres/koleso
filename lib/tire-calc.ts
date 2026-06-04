export type TireSpec = {
  width: number;
  profile: number;
  rimDiameter: number;
};

export type TireFit = {
  fitsRim: boolean;
  fitMessage: string;
};

export type TireCalc = {
  sidewallHeight: number;
  overallDiameter: number;
  treadWidth: number;
} & TireFit;

export function checkTireFit(tireWidth: number, rimWidth: number): TireFit {
  const idealRimInches = tireWidth / 25.4 - 1;
  const delta = rimWidth - idealRimInches;

  if (Math.abs(delta) <= 0.5) {
    return { fitsRim: true, fitMessage: "Pasuje idealnie" };
  }
  if (delta > 0.5 && delta <= 1.0) {
    return { fitsRim: true, fitMessage: "Na styk – stretch look" };
  }
  if (delta > 1.0) {
    return {
      fitsRim: false,
      fitMessage: `Za szeroka felga (+${delta.toFixed(1)}″) – mocny stretch, ryzyko zejścia z opony`,
    };
  }
  if (delta < -0.5 && delta >= -1.0) {
    return { fitsRim: true, fitMessage: "Na styk – opona lekko wybrzuszona" };
  }
  return {
    fitsRim: false,
    fitMessage: `Za wąska felga (${delta.toFixed(1)}″) – opona mocno wybrzuszona (bulge)`,
  };
}

export function calcTire(spec: TireSpec, rimWidth: number): TireCalc {
  const sidewallHeight = (spec.width * spec.profile) / 100;
  const overallDiameter = spec.rimDiameter * 25.4 + 2 * sidewallHeight;
  const treadWidth = spec.width;
  const fit = checkTireFit(spec.width, rimWidth);
  return { sidewallHeight, overallDiameter, treadWidth, ...fit };
}

export function formatTireSize(width: number, profile: number, rimDiameter: number): string {
  return `${width}/${profile}R${rimDiameter}`;
}
