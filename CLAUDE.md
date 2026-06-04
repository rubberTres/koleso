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

This is a **community fitment browser** — users pick a car make/model and wheel spec and see submissions by others (with photos showing how it looks). A standalone wheel & tire fitment calculator (the original `/` page) coexists as a tool.

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
- `prisma/schema.prisma` is the **source of truth for DB models**. `lib/generated/prisma/` is generated output (gitignored — never edit by hand). The only DB entrypoint is `lib/prisma.ts` (`PrismaClient` singleton, HMR-safe). Import as `import { prisma } from "@/lib/prisma"`. **Server-only** via `server-only` package.
- **Models** (see schema for full shape): `User` (mirror of Clerk, has `clerkId @unique`, `role` enum `USER`/`ADMIN`), `CarMake`/`CarModel` (admin-curated catalog, `@@unique([makeId, name])`), `Car` (one community submission = car identity + wheel/tire spec + owner), `Photo`. Prisma 7 row types are `<Model>Model` (e.g. `UserModel`), exported from `@/lib/generated/prisma/models`. Enums are both type + value, exported from `@/lib/generated/prisma/enums`.
- **Auth** is Clerk. Read `auth()` only from `@clerk/nextjs/server` and **always await**. `lib/auth.ts` is the only file routes import from for auth: `getCurrentUser()` does just-in-time User mirror (works without webhook), `requireUser()` / `requireAdmin()` throw `AuthError`, `withAuth(handler)` translates `AuthError` to 401/403. Webhook at `/api/webhooks/clerk` does proactive sync; `CLERK_WEBHOOK_SIGNING_SECRET` env var required (Clerk dashboard → Webhooks → Add Endpoint).
- **`proxy.ts` is public-first** — `clerkMiddleware()` only sets up auth context, no `auth.protect()`. Each route handler enforces its own policy via the helpers above. Matcher includes `/__clerk/:path*` (required by Clerk).
- `lib/storage.ts` is the only entry to **Cloudflare R2** (S3-compatible object storage for photos). Exports `getUploadUrl(key, contentType)` for presigned PUT URLs (client uploads directly to R2, bypassing the Next.js server), `getPublicUrl(key)` for the public CDN URL, and `deleteObject(key)`. **Server-only**. Keys are caller-defined; the upload-url route uses `cars/<carId>/<uuid>.<ext>`.
- HTTP API lives under `app/api/`. **No Server Actions** in this repo — everything is Route Handlers (`route.ts`). Mutations validate input by hand (no Zod yet), return `{ error }` JSON on failure. Auth policy per route:

  | Route | Public | USER | Owner | ADMIN |
  |---|:-:|:-:|:-:|:-:|
  | `GET /api/cars` (filters: `?modelId=`, `?wheelSize=`) | ✅ | ✅ | ✅ | ✅ |
  | `GET /api/cars/[id]` | ✅ | ✅ | ✅ | ✅ |
  | `POST /api/cars` (creates with `userId` from session) | ❌ | ✅ | — | ✅ |
  | `PATCH /api/cars/[id]` | ❌ | ❌ | ✅ | ✅ |
  | `DELETE /api/cars/[id]` | ❌ | ❌ | ✅ | ✅ |
  | `POST /api/photos/upload-url` (presigned R2 PUT, 5min TTL) | ❌ | ❌ | ✅ | ✅ |
  | `POST /api/photos` (record after PUT) | ❌ | ❌ | ✅ | ✅ |
  | `DELETE /api/photos/[id]` | ❌ | ❌ | ✅ | ✅ |
  | `GET /api/makes`, `GET /api/models?makeId=` | ✅ | ✅ | ✅ | ✅ |
  | `POST/DELETE /api/makes`, `POST/DELETE /api/models` | ❌ | ❌ | ❌ | ✅ |
  | `POST /api/webhooks/clerk` (signed by Clerk) | ✅* | — | — | — |

  *Webhook verifies its own signature via `verifyWebhook` from `@clerk/nextjs/webhooks` — public at proxy level but rejects unsigned requests at handler level.

  Allowed photo content types: `image/jpeg`, `image/png`, `image/webp`. Key format: `cars/<carId>/<uuid>.<ext>`. Known gap: `DELETE /api/cars/[id]` cascades photos in DB but orphans R2 objects.

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
