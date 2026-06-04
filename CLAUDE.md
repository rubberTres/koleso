# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml`, `pnpm-workspace.yaml`).

- `pnpm dev` — start Next.js dev server on http://localhost:3000
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` / `pnpm lint:fix` — ESLint (flat config, `next/core-web-vitals` + `next/typescript` + prettier)
- `pnpm format` / `pnpm format:check` — Prettier across the repo

No test runner is configured.

## Architecture

This is a wheel & tire fitment calculator for car enthusiasts (default preset is a Nissan S13). It's a single-page Next.js App Router app: a server component shell that hands a pre-computed base preset to a single client component which owns all interactive state.

**Data flow** (one direction, no global state):

```
app/page.tsx (server)
  └─ calcWheel(BASE_PRESET)
     └─ app/calculator.tsx (client, "use client")
        ├─ useState: spec, tireSpec, tireEnabled
        ├─ useMemo: calcWheel(spec), compareWheels, calcTire
        └─ renders SVG views from app/components/* + result cards
```

**Layering** — keep these boundaries:

- `lib/` is **pure math**, no React. `wheel-presets.ts` defines `WheelSpec` / `WheelCalc` and the offset math (`effectiveOffset = et - spacer`, outer/inner edges from rim half-width). `tire-calc.ts` does sidewall/overall-diameter math and the rim-fit verdict ("stretch", "bulge"). `fender-config.ts` exposes the fender-from-base-outer clearance constant. When adding a calculation, add it here first, then consume it.
- `app/components/*-view.tsx` are SVG visualizations (`FrontView`, `TopView`). They take already-computed `WheelCalc` / `TireCalc` as props — they should never call the calc functions themselves. Coordinates are in millimeters and the viewBox is derived from wheel + fender geometry.
- `app/calculator.tsx` is the only place that owns state and wires inputs → calc → views/verdicts.

**Conventions worth preserving:**

- UI copy and inline comments are in **Polish** (e.g. "Twój set", "lico wystaje", "błotnik"). Match the existing tone when adding strings.
- UI uses **HeroUI v3** (`@heroui/react`) with a dot-namespaced compound API: `Card.Header`, `Card.Title`, `NumberField.Group`, `Slider.Track`, etc. Don't refactor these into the wrong shape.
- Tailwind v4 via `@tailwindcss/postcss` (no `tailwind.config`). Theme tokens come from HeroUI styles (`@import "@heroui/styles"` in `app/globals.css`) — use semantic classes like `text-muted`, `text-accent`, `text-warning`, `text-success`, `text-separator`, `text-foreground` and CSS vars like `var(--color-success)` rather than hardcoded colors.
- Path alias `@/*` maps to the repo root (e.g. `@/lib/tire-calc`).
- Prettier: 100 col, double quotes, semis, trailing commas, `prettier-plugin-tailwindcss` sorts class names — let it.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`.

- **Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`, `perf`, `build`, `ci`
- **Scope** is optional but encouraged. Use the area of the codebase: `calc`, `top-view`, `front-view`, `lib`, `deps`, `claude`, etc.
- **Subject** is imperative, lowercase, no trailing period, ideally ≤72 chars.
- Breaking changes: append `!` after type/scope (e.g. `refactor(lib)!: rename WheelSpec fields`) and explain in the body.

Examples:

```
feat(calc): add tire pressure input
fix(top-view): correct fender clearance math
chore(deps): bump next to 16.2.7
docs(claude): note new db layer
refactor(lib): split tire-calc into modules
```
