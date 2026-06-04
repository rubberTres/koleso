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

**Database (local):**

- `pnpm db:up` / `pnpm db:down` — start/stop Postgres via `docker-compose.yml`
- `pnpm db:logs` — tail Postgres logs
- `pnpm db:reset` — `docker compose down -v` — **wipes all data**
- `pnpm prisma migrate dev --name <desc>` — after editing `prisma/schema.prisma`: creates a migration in `prisma/migrations/`, applies it, regenerates the client
- `pnpm prisma studio` — GUI to inspect/edit data
- `pnpm prisma generate` — regenerate the client (also runs automatically as `postinstall`)

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
- `prisma/schema.prisma` is the **source of truth for DB models**. `lib/generated/prisma/` is generated output (gitignored — never edit by hand, never import directly). The only DB entrypoint is `lib/prisma.ts`, which exports a `PrismaClient` singleton (HMR-safe via `globalThis`). Import as `import { prisma } from "@/lib/prisma"`. **Server-only** (enforced via `server-only` package) — do not import from `"use client"` components.
- `lib/storage.ts` is the only entry to **Cloudflare R2** (S3-compatible object storage for photos). Exports `getUploadUrl(key, contentType)` for presigned PUT URLs (client uploads directly to R2, bypassing the Next.js server), `getPublicUrl(key)` for the public CDN URL, and `deleteObject(key)`. **Server-only**. Keys are caller-defined; the upload-url route uses `cars/<carId>/<uuid>.<ext>`.
- HTTP API lives under `app/api/`. Convention: **no Server Actions** in this repo — everything is Route Handlers (`route.ts`), even mutations. Mutations validate input by hand (no Zod yet), return JSON with `{ error }` and an appropriate status on failure. Endpoints currently in place:
  - `GET /api/cars` — list cars with `_count` of photos/fittings
  - `POST /api/cars` — create (`brand`, `model` required; `year`, `bodyType` optional)
  - `GET /api/cars/[id]` — car with photos + fittings
  - `DELETE /api/cars/[id]` — cascades to fittings + photo DB rows (does **not** clean up R2 objects — known limitation, address later via a sweep job or per-photo deletes)
  - `POST /api/photos/upload-url` — body `{ carId, contentType }` → `{ uploadUrl, key, publicUrl }`. Client then PUTs the file to `uploadUrl` directly (5-min TTL). Allowed types: `image/jpeg`, `image/png`, `image/webp`.
  - `POST /api/photos` — body `{ carId, key, width?, height? }` → creates the `Photo` row after the client confirms the R2 PUT succeeded.
  - `DELETE /api/photos/[id]` — deletes from R2 then from DB.

**Conventions worth preserving:**

- UI copy and inline comments are in **Polish** (e.g. "Twój set", "lico wystaje", "błotnik"). Match the existing tone when adding strings.
- UI uses **HeroUI v3** (`@heroui/react`) with a dot-namespaced compound API: `Card.Header`, `Card.Title`, `NumberField.Group`, `Slider.Track`, etc. Don't refactor these into the wrong shape.
- Tailwind v4 via `@tailwindcss/postcss` (no `tailwind.config`). Theme tokens come from HeroUI styles (`@import "@heroui/styles"` in `app/globals.css`) — use semantic classes like `text-muted`, `text-accent`, `text-warning`, `text-success`, `text-separator`, `text-foreground` and CSS vars like `var(--color-success)` rather than hardcoded colors.
- Path alias `@/*` maps to the repo root (e.g. `@/lib/tire-calc`).
- Prettier: 100 col, double quotes, semis, trailing commas, `prettier-plugin-tailwindcss` sorts class names — let it.
- `.env` holds `DATABASE_URL` for both Next.js runtime and the Prisma CLI (Prisma 7 loads it via `dotenv/config` in `prisma.config.ts`). `.env` is gitignored; the committed template is `.env.example`. For local dev the default credentials match `docker-compose.yml` (`koleso:koleso@localhost:5432/koleso`).
- `.env` also holds R2 vars (`R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_PUBLIC_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`). `next.config.ts` derives the allowed `images.remotePatterns` hostname from `R2_PUBLIC_URL` at build time — if you change the public URL (e.g. switch from dev `pub-*.r2.dev` to a custom domain), no code change needed, just env update.

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
