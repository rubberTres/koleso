import { Calculator } from "./calculator";
import { BASE_PRESET, calcWheel } from "@/lib/wheel-presets";

export default async function HomePage() {
  const baseCalc = calcWheel(BASE_PRESET);

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-8 py-10">
      <header className="space-y-2">
        <div className="text-muted font-mono text-[11px] tracking-widest uppercase">
          Fitment calculator
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Wheel &amp; tire fitment</h1>
        <p className="text-muted max-w-2xl">
          Porównaj swój set z bazą — sprawdź jak lico wystaje albo chowa się względem stocku, jak
          pasuje opona do felgi i czy zmieścisz koło w błotniku.
        </p>
      </header>

      <Calculator baseCalc={baseCalc} />
    </main>
  );
}
