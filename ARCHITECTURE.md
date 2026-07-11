# Architecture

Concise reference for how Nithish Fit is put together. See [PLAN.md](PLAN.md) for the
original implementation plan and [ASSUMPTIONS.md](ASSUMPTIONS.md) for documented scope
decisions.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript, `strict: true` |
| UI | React 19, Tailwind CSS v4, shadcn/ui (`@base-ui/react` primitives) |
| Forms | React Hook Form + Zod resolvers |
| Charts | Recharts |
| Local storage | IndexedDB via `idb` |
| Remote storage | Supabase (Postgres + Auth), optional |
| Validation | Zod schemas shared between UI, data layer, and seed data |
| Unit tests | Vitest |
| E2E tests | Playwright |

## Two storage backends, one interface

Every screen talks to `lib/data/provider.ts`'s `DataProvider` interface — never directly
to IndexedDB or Supabase. Two implementations exist:

- **`DemoDataProvider`** (`lib/data/demoProvider.ts`) — reads/writes IndexedDB via the
  generic helpers in `lib/data/localDb.ts`. This is the default; it requires no
  environment variables and works fully offline because there's no network involved.
- **`SupabaseDataProvider`** (`lib/data/supabaseProvider.ts`) — reads/writes Postgres via
  `@supabase/supabase-js`, scoped by row-level security policies keyed on `auth.uid()`.
  Wrapped in `withOfflineQueue` (`lib/pwa/outbox.ts`) so writes made while offline are
  queued in IndexedDB and replayed when the browser's `online` event fires.

`lib/data/context.tsx`'s `DataProviderRoot` picks the backend once, at app start, based on
`isSupabaseConfigured()` (are `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
both set?). Screens call `useData()` to get the active provider and `useProviderData()`
(`lib/data/hooks.ts`) to fetch from it with loading/error state.

## Domain logic lives in `lib/`, not in components

Every calculation the spec requires an automated test for is a pure function with no React
or storage dependency, so it's testable in isolation:

- `lib/calc/` — BMR, TDEE, macro targets, training volume, 7-day moving average, the
  progressive-overload rule engine (`progression.ts`), deload detection, readiness
  scoring, the 25kg safety cap (`safety.ts`), recipe nutrient math.
- `lib/food-parser/` — the deterministic natural-language food parser: tokenizer (quantity
  + unit + food-name extraction), Indian unit normalization, fuzzy alias matching, and the
  orchestrator that ties them together with a food index.
- `lib/mealplan/` — the 7-day meal-plan generator and its template bank.
- `lib/workout/` — orchestration that *uses* `lib/calc` (building a session from a
  programme day, computing progression suggestions from history, weekly adherence stats).

Components under `app/` and `components/` are thin: they fetch via `useProviderData`, call
into `lib/calc`/`lib/workout`/`lib/food-parser` for any real logic, and render the result.

## Database schema

SQL migrations live in `supabase/migrations/` (numbered, applied in order). They cover
every entity in the spec: profile/preferences/medical restrictions, equipment, the
exercise directory (+ aliases + substitutions), programme/day/planned-exercise, sessions/
performances/sets, readiness, body measurements, nutrition targets, the food database (+
servings + aliases), recipes, food logs, meal plans, supplement logs, and application
settings. Row-level security (`0011_rls.sql`) scopes every user-owned table to
`auth.uid() = user_id`; global reference tables (exercises, equipment, non-custom foods)
are readable by any authenticated user and are not writable from the client.

`lib/types/` mirrors this schema as Zod schemas (camelCase, matching the TS domain
model) — the same schemas validate seed data (`db/seed/validate.ts`), demo-mode
IndexedDB records, and (conceptually) what Supabase rows should look like after the
snake_case ⇄ camelCase mapping in `lib/data/caseConvert.ts`.

## Seed data

`db/seed/` holds one TS module per entity family (`exercises.ts`, `foods.ts`,
`profile.ts`, `equipment.ts`, `programme.ts`, `sessionHistory.ts`,
`bodyAndSupplementLogs.ts`, `foodLogs.ts`, `mealPlan.ts`). `db/seed/index.ts` re-exports
the pieces; `lib/data/seedDemo.ts` writes them into IndexedDB the first time the app loads
in demo mode. `db/seed/validate.ts` (`npm run seed:check`) parses every seed record
through its real Zod schema plus cross-checks slug references, so a malformed seed entry
fails fast instead of silently breaking a screen at runtime.

Session/body-weight/food-log history is generated relative to *today's date* at seed time
(not a fixed date), so "previous week" comparisons and moving averages are always
meaningful no matter when the app is actually opened.

## PWA / offline

- `app/manifest.ts` + `app/icons/[size]/route.tsx` generate the web app manifest and its
  icons (via `next/og`'s `ImageResponse`, so no binary asset files are checked in).
- `public/sw.js` is a small hand-rolled service worker: precaches the five main routes on
  install, stale-while-revalidate for same-origin GETs, never touches API/data calls.
- Demo mode's "offline support" is really "no network dependency at all" — IndexedDB is
  local by construction.
- Supabase mode's offline support is the `withOfflineQueue` outbox described above.

## Directory map

```
app/(app)/            route group for the 5-tab shell (bottom nav) + all screens
components/           shared UI (components/ui = shadcn) + feature components
lib/calc/              pure calculation engines + safety rules
lib/food-parser/        NL parser
lib/mealplan/           meal-plan generator + templates
lib/workout/            session-building / progression / adherence orchestration
lib/data/               DataProvider interface + demo/Supabase implementations
lib/export/             CSV/JSON export + JSON restore
lib/pwa/                offline outbox
supabase/migrations/    SQL schema + RLS
db/seed/                seed data + validator
tests/unit/             Vitest specs (one file per lib/calc, lib/food-parser module)
tests/e2e/               Playwright specs (critical user flows)
```
