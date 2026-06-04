# Koleso — authed-user UI: garage + CRUD + photo upload

**Date:** 2026-06-04
**Status:** Design — pending implementation
**Scope:** First pass of authenticated UI. Adds `/dashboard` with a list of the user's
own car submissions, create / edit / delete flows, and inline photo upload to R2.
Public browse and admin make/model management are explicitly out of scope and
will be designed separately. The existing calculator stays on `/`.

## Goals

- Logged-in users can submit a car (make/model + wheel spec + ≥1 photo) and see it
  in their personal garage.
- Submissions carry enough fitment data to be useful for the future public browse
  (`Model + WheelSize + WheelWidth + ET + ≥1 photo` enforced).
- Production-grade code: shared validation, typed client/server contract, predictable
  error UX, no Server Actions, single Route-Handler API surface.

## Non-goals (this iteration)

- Public browse / filter UI.
- Admin CRUD for `CarMake` / `CarModel` (use Prisma Studio for now).
- Optimistic UI for mutations.
- HEIC → JPG conversion in browser.
- Image cropping / re-ordering / cover-photo selection.

## Tech decisions

| Topic | Choice | Reason |
|---|---|---|
| Routing | App Router; `/dashboard/*` segment | Matches Next.js convention; clean separation from `/` calculator. |
| Data fetching | TanStack Query (`@tanstack/react-query`) | User-chosen. All reads/writes from client through `/api`. No SWR, no RSC fetching for user data. |
| Mutations | TanStack `useMutation` against existing Route Handlers | No Server Actions (project convention). |
| Forms | `react-hook-form` + `@hookform/resolvers/zod` | Standard, handles dirty / errors / submit cleanly. |
| Validation | Zod schemas in `lib/validators/*` | One source of truth for client (RHF resolver + TS types) and server (route handler `parse()`). |
| UI components | HeroUI v3 (existing) | Already in repo; nav stays as in current root layout. |
| Auth gate on pages | Server Component layout calls `auth()` + `redirect("/sign-in")` | Prevents flash-of-loading for signed-out users. |
| Auth gate on API | Existing `requireUser` / `requireAdmin` + `withAuth` | Already wired. |
| Error boundary | `react-error-boundary` (or a small local component) at `/dashboard/layout.tsx` | One catch-all for render errors inside the dashboard. |

## Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│  app/dashboard/layout.tsx  (Server Component, auth gate)   │
│  ├─ auth()  →  redirect("/sign-in") if not signed in       │
│  └─ <ErrorBoundary> wraps children                          │
└─────────────────────────────────────────────────────────────┘
                          │
   ┌──────────────────────┼─────────────────────────────────┐
   │                      │                                 │
┌──▼──────────────┐  ┌────▼─────────────────┐  ┌────────────▼───────────┐
│ /dashboard      │  │ /dashboard/cars/new  │  │ /dashboard/cars/[id]   │
│ ("use client")  │  │ ("use client")       │  │ ("use client")         │
│ useQuery        │  │ RHF + Zod            │  │ RHF + Zod              │
│  ["cars","mine"]│  │ useMutation create   │  │ useMutation update     │
│ → grid of Card  │  │ + photo upload loop  │  │ + photo add/delete     │
│                 │  │ → redirect to [id]   │  │ + delete-car danger   │
└─────────────────┘  └──────────────────────┘  └────────────────────────┘
                          │ all requests
                          ▼
            ┌───────────────────────────┐
            │  lib/api.ts (fetch helper)│
            │  throws ApiError on !ok   │
            └───────────────────────────┘
                          │
                          ▼
                    /api Route Handlers
                    (Zod validate body)
                          │
                ┌─────────┼──────────┐
                ▼         ▼          ▼
              Prisma     R2 (presign + PUT)
```

## Route map

| Path | Component | Purpose |
|---|---|---|
| `/dashboard/layout.tsx` | Server | Auth gate, redirect, error boundary, dashboard chrome. |
| `/dashboard/page.tsx` | Client | List of `["cars","mine"]`, empty/loading/error states. |
| `/dashboard/cars/new/page.tsx` | Client | Create form + photo drop-zone, redirects to `[id]` on success. |
| `/dashboard/cars/[id]/page.tsx` | Client | Edit form + existing-photo manager + add-photos + danger-zone delete. |

## Providers (root)

`app/providers.tsx` (new, `"use client"`):

```ts
"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
// ReactQueryDevtools imported via dynamic() with ssr:false, gated on NODE_ENV.

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
      mutations: { retry: 0 },
    },
    queryCache: new QueryCache({ onError: globalErrorHandler }),
    mutationCache: new MutationCache({ onError: globalErrorHandler }),
  }));
  return <QueryClientProvider client={client}>{children}{devtools}</QueryClientProvider>;
}
```

Root `app/layout.tsx` order: `<Providers><ClerkProvider>…</ClerkProvider></Providers>`
(QueryClient outermost so Clerk hooks invoked inside Query consumers still resolve).

## Data layer

### Query keys

| Key | Source | Used by |
|---|---|---|
| `["cars","mine"]` | `GET /api/cars/mine` | `/dashboard` list |
| `["car", id]` | `GET /api/cars/[id]` | `/dashboard/cars/[id]` |
| `["makes"]` | `GET /api/makes` | Make autocomplete |
| `["models", makeId]` | `GET /api/models?makeId=` | Model autocomplete (enabled when makeId) |

### Hooks (`lib/queries/*.ts`)

- `lib/queries/cars.ts` — `useMyCars`, `useCar(id)`, `useCreateCar`, `useUpdateCar`, `useDeleteCar`.
- `lib/queries/photos.ts` — `useUploadPhoto(carId)` (orchestrates presign → PUT → record), `useDeletePhoto`.
- `lib/queries/catalog.ts` — `useMakes`, `useModels(makeId)`.

Invalidation rules:

| Mutation | Invalidates |
|---|---|
| `useCreateCar` | `["cars","mine"]` |
| `useUpdateCar(id)` | `["car", id]`, `["cars","mine"]` |
| `useDeleteCar(id)` | `["cars","mine"]` (and route push to `/dashboard`) |
| `useUploadPhoto(carId)` | `["car", carId]` |
| `useDeletePhoto(id, carId)` | `["car", carId]` |

### `lib/api.ts`

```ts
export class ApiError extends Error {
  constructor(public status: number, public body: unknown) { super(`API ${status}`); }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
  return res.json();
}
```

## API changes

### New: `GET /api/cars/mine`

- Auth: `requireUser()`.
- Returns: `Car[]` filtered by `userId === currentUser.id`, includes `model.make`, `photos`,
  `_count.photos`. Order `createdAt desc`.

### Validation: introduce `lib/validators/`

`lib/validators/car.ts`:
```ts
export const createCarInput = z.object({
  modelId:    z.string().cuid(),
  wheelSize:  z.nativeEnum(WheelSize),
  wheelWidth: z.nativeEnum(WheelWidth),
  et:         z.number().int().min(-50).max(80),
  year:       z.number().int().min(1950).max(2030).nullable().optional(),
  bodyType:   z.nativeEnum(BodyType).nullable().optional(),
  tireWidth:  z.nativeEnum(TireWidth).nullable().optional(),
  tireProfile:z.nativeEnum(TireProfile).nullable().optional(),
});
export const updateCarInput = createCarInput.partial();
export type CreateCarInput = z.infer<typeof createCarInput>;
export type UpdateCarInput = z.infer<typeof updateCarInput>;
```

`lib/validators/photo.ts`:
```ts
export const presignInput = z.object({
  carId:       z.string().cuid(),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});
export const recordPhotoInput = z.object({
  carId:    z.string().cuid(),
  publicId: z.string().min(1),
  width:    z.number().int().positive().optional(),
  height:   z.number().int().positive().optional(),
});
```

`lib/validators/parse.ts` (helper):
```ts
export async function parseJson<T extends z.ZodTypeAny>(req: Request, schema: T) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_input", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  return parsed.data as z.infer<T>;
}
```
Returns `Response` on failure, parsed data on success (route checks `instanceof Response`).

### Routes to update (replace hand-rolled `inEnum` with Zod)

- `POST /api/cars` — `createCarInput`. **Breaking:** `wheelWidth` and `et` become required at API level. (Schema column stays nullable for old rows / future drafts.)
- `PATCH /api/cars/[id]` — `updateCarInput`.
- `POST /api/photos/upload-url` — `presignInput`.
- `POST /api/photos` — `recordPhotoInput`.

### R2 orphan fix

- `DELETE /api/cars/[id]`: read `photos` (just their `publicId`s) **before** the DB
  delete, then run `deleteObject(publicId)` for each after the DB row is gone.
  Best-effort: log R2 errors but still return 200 to the caller (DB is the source
  of truth; the orphan is recoverable later by a cleanup job).
- `DELETE /api/photos/[id]`: same idea — read `publicId`, DB delete, then `deleteObject`.

### Auth policy delta

Add to the table in CLAUDE.md:

| Route | Public | USER | Owner | ADMIN |
|---|:-:|:-:|:-:|:-:|
| `GET /api/cars/mine` | ❌ | ✅ | ✅ | ✅ |

## Forms

### Create (`/dashboard/cars/new`)

Two-column layout (HeroUI `Card`s), labels in Polish to match the rest of the app:

Left column — car spec:
- **Marka** — `Autocomplete` over `["makes"]`, `allowsCustomValue=false`, required.
- **Model** — `Autocomplete` over `["models", makeId]`, disabled until `makeId`, required;
  resets when make changes.
- **Rok** — `NumberField`, optional, min 1950 max 2030.
- **Nadwozie** — `Select` over `BodyType`, optional.
- **Rozmiar felgi** — `Select` over `WheelSize`, label e.g. `R_18 → "18″"`, required.
- **Szerokość felgi** — `Select` over `WheelWidth`, label e.g. `W_8_5 → "8.5″"`, required.
- **ET** — `NumberField`, min -50 max 80, required.
- **Szerokość opony** — `Select` over `TireWidth`, label e.g. `T_235 → "235"`, optional.
- **Profil opony** — `Select` over `TireProfile`, label e.g. `P_40 → "40"`, optional.

Right column — photos:
- Drop-zone (`<input type="file" multiple accept="image/jpeg,image/png,image/webp">` +
  drag handlers).
- Local previews via `URL.createObjectURL`, revoked in `useEffect` cleanup.
- Client-side checks: size ≤ 10 MB, type in allowed set. Errors shown inline beneath the
  drop-zone.
- Files held in component state (not RHF). RHF only validates count ≥ 1 via a separate
  `photosInput = z.array(z.instanceof(File)).min(1)`.
- Max 10 photos.

Enum labels live in `lib/enum-labels.ts` as `WHEEL_SIZE_LABEL: Record<WheelSize,string>`
etc. — one map per enum.

Submit flow (single `useMutation`):

1. `POST /api/cars` → `car`.
2. For each file (sequential): read width/height via `Image()` on object URL, then
   presign → PUT R2 → `POST /api/photos`. Track `uploaded[]` and `failed[]`.
3. On success: `router.push("/dashboard/cars/${car.id}")` + success toast.
4. On partial failure (car created, some photos failed): redirect to
   `/dashboard/cars/${car.id}` anyway, with a query flag (`?upload=partial`) so the edit
   page can show a toast listing the failed file names. The user retries from the edit
   page's "Dodaj zdjęcia" drop-zone.

Cancel: `router.back()` (confirm dialog if `formState.isDirty || files.length > 0`).

### Edit (`/dashboard/cars/[id]`)

Same two-column layout. Right column has:
- **Istniejące zdjęcia** — grid of thumbs from `car.photos`, each with delete button +
  confirm dialog (`useDeletePhoto`).
- **Dodaj zdjęcia** — drop-zone identical to create. Its own `useMutation` running the
  same upload loop; not coupled to the form submit.

Form submit is `PATCH` via `useUpdateCar(id)`. Button "Zapisz zmiany" disabled when
`!formState.isDirty`. On success: `reset(updatedValues)` so `isDirty` returns to false.

Danger zone (bottom): card with red `Usuń auto` → confirm dialog → `useDeleteCar(id)` →
`router.push("/dashboard")`.

### Dashboard list (`/dashboard`)

- `useMyCars()` → grid (`Card` per car): one thumb (first photo, or placeholder), `Make Model`,
  spec line (`18″ × 9″ ET35 · 235/40` when full), small badges for `bodyType` and `year`.
- Card click → `/dashboard/cars/[id]`.
- Empty state: icon + "Nie masz jeszcze aut" + `Dodaj auto` button.
- Loading: 3–6 skeleton cards.
- Error: inline card with "Coś się wykrzaczyło" + retry button.

## Error handling

### Global (TanStack caches in `Providers`)

- `ApiError.status === 401` → `window.location.assign("/sign-in")` (full reload to reset Clerk).
- `ApiError.status === 403` → `addToast` "Brak uprawnień".
- Network error (fetch throw, no `ApiError`) → `addToast` "Brak połączenia, sprawdź internet".
- `ApiError.status === 400` (Zod fieldErrors) is NOT handled globally — each mutation's
  own `onError` maps `body.fieldErrors` to RHF `setError`.

### Page-level

- `app/dashboard/layout.tsx` renders `<ErrorBoundary fallback={<DashboardErrorFallback />}>`.
- Fallback shows generic "Coś się wykrzaczyło" + reload button.

### Edge cases

| Case | Handling |
|---|---|
| File > 10 MB | Client check before upload; inline error per file. |
| Disallowed MIME (e.g. HEIC) | Client check; inline error "tylko JPG/PNG/WebP". |
| Network fail during R2 PUT | That file marked `failed`; loop continues. |
| Submitting form with required field empty | Zod via RHF resolver; per-field error label. |
| Car deleted from another tab while editing | `useCar(id)` 404 → show "Auto już nie istnieje" + link `/dashboard`. |
| Navigation with dirty form | `beforeunload` listener if `formState.isDirty || files.length > 0`. |
| Admin removes a model the user picked | Autocomplete shows empty value + helper "Model usunięty — wybierz nowy". |

## New dependencies

| Package | Why | Where |
|---|---|---|
| `@tanstack/react-query` | data layer | runtime |
| `@tanstack/react-query-devtools` | devtools | dev only |
| `react-hook-form` | forms | runtime |
| `@hookform/resolvers` | Zod resolver for RHF | runtime |
| `zod` | shared validation | runtime |
| `react-error-boundary` | layout-level error boundary (optional, can be local) | runtime |

## CLAUDE.md updates (to write at the end of implementation)

1. **New "Data fetching & state" section** documenting TanStack Query as the data layer
   for client components, query-key convention, and `lib/queries/` hook location.
2. **Strengthen "no Server Actions" rule** under Layering — make it explicit that all
   data flow goes through `/api` Route Handlers and forms never use
   `<form action={serverAction}>`.
3. **New "Validation" bullet** — Zod schemas in `lib/validators/*.ts`, shared between
   API (`parseJson` helper, 400 with `fieldErrors`) and client (RHF resolver + TS types).
4. Add `GET /api/cars/mine` to the auth policy table.

## Open questions / future work

- Public browse + filters (separate spec).
- Admin UI for makes/models (separate spec; until then, Prisma Studio).
- Optimistic UI for `useDeletePhoto` and `useUpdateCar`.
- Image processing (resize/strip EXIF) — currently the user-uploaded file goes raw to R2.
- Cover-photo selection / photo ordering — currently first-by-`createdAt`.
- Multipart upload for files > 5 MB (R2 single-PUT limit is generous; not urgent).

## Implementation order (rough)

1. Deps: install TanStack Query, RHF, Zod, resolvers, error-boundary.
2. `lib/validators/*` + `parseJson` helper.
3. Refactor existing `/api/cars`, `/api/cars/[id]`, `/api/photos/*` to use Zod (no behavior
   change beyond `wheelWidth`+`et` becoming required on POST).
4. New `/api/cars/mine` route.
5. R2 orphan fix in `DELETE /api/cars/[id]` and `/api/photos/[id]`.
6. `app/providers.tsx` + wire into root layout.
7. `lib/api.ts`, `lib/queries/*`, `lib/enum-labels.ts`.
8. `app/dashboard/layout.tsx` (auth gate + error boundary).
9. `app/dashboard/page.tsx` (list).
10. `app/dashboard/cars/new/page.tsx` (create form + upload loop).
11. `app/dashboard/cars/[id]/page.tsx` (edit form + photo manager + danger zone).
12. CLAUDE.md updates.

Detailed step-by-step plan to be produced by the writing-plans skill after this spec is
approved.
