# Nithish Fit — Implementation Plan

## 1. Overview

Nithish Fit is a single-user, mobile-first Progressive Web App for workout
progression, Indian food logging, nutrition planning and body-weight
management. It is built as a Next.js (App Router) + TypeScript application
that runs in two modes:

- **Demo mode** (default, no environment variables required): all data lives
  in the browser (IndexedDB via `idb-keyval`-style wrapper), pre-populated
  with four weeks of realistic seed history so every screen is immediately
  testable.
- **Supabase mode** (when `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set): Postgres via Supabase, email
  magic-link/password auth, row-level security scoped to the single user.

A single `DataProvider` interface (`lib/data/provider.ts`) is implemented by
both `lib/data/demo-provider.ts` (IndexedDB) and
`lib/data/supabase-provider.ts` (Postgres). Screens only talk to the
interface, so the storage backend is swappable without touching UI code.

## 2. Architecture

```
nithish-fit/
  app/                      Next.js App Router routes (mobile shell + 5 tabs)
  components/                shared UI (shadcn/ui-based) + feature components
  lib/
    calc/                    pure calculation engines (BMR/TDEE/macro, volume,
                              progression, deload, moving average) + tests
    food-parser/             deterministic NL food parser + tests
    data/                    DataProvider interface, demo + supabase impls
    types/                   zod schemas + inferred TS types (shared contract)
    pwa/                     offline queue + sync helpers
  db/
    migrations/              SQL migration files (numbered)
    seed/                    SQL + TS seed data (exercises, foods, programme)
  public/                    manifest.json, icons, service worker
  tests/
    unit/                    vitest
    e2e/                     playwright
  supabase/                  supabase CLI config (local dev)
```

### Data flow
UI (Server/Client Components) → React Query-free local hooks
(`lib/data/hooks.ts`) → `DataProvider` → IndexedDB (demo) or Supabase
(configured). All writes in demo mode are synchronous-feeling (IndexedDB is
async but wrapped) and all writes in Supabase mode use optimistic UI + an
offline outbox table replayed on reconnect (`lib/pwa/outbox.ts`), satisfying
the offline-logging requirement in both modes.

### Why not Prisma/ORM
Single user, small schema, and the requirement to run identically against
Supabase-js (browser-safe) or IndexedDB rules out a server-only ORM. Raw SQL
migrations + Supabase generated types (hand-written here, since no live
Supabase project exists yet) keep the two backends honestly in sync.

## 3. Phases

1. Scaffold Next.js 15 (App Router) + TS strict + Tailwind + shadcn/ui + ESLint + Prettier.
2. Zod schemas / shared types for every entity in section 12 of the spec.
3. Calculation engine (`lib/calc/*`) with Vitest unit tests — BMR, TDEE,
   macros, carbs-from-remaining, volume, progression rules, weight cap,
   pain-triggered reduction, deload, 7-day moving average.
4. Deterministic NL food parser (`lib/food-parser/*`) with unit tests —
   quantity/unit extraction, Indian unit normalisation, alias matching,
   fuzzy fallback.
5. SQL schema + migrations + RLS policies (`db/migrations`).
6. Seed data: 70+ exercise directory, Indian food DB (~120 items incl.
   aliases), 4-day programme, 4 weeks of session history, sample meal plan.
7. Data layer: demo provider (IndexedDB) seeded on first load; Supabase
   provider using `@supabase/ssr` + `@supabase/supabase-js`.
8. Auth: Supabase email magic-link/password when configured; demo mode
   auto-authenticates a single local "Nithish" identity.
9. App shell: bottom nav, theme (dark/light), mobile layout primitives.
10. Screens: Today, Workout (+ logging + rest timer), Progression, Exercise
    directory, Food log, Recipe builder, Meal planner, Progress/charts,
    Settings (profile/equipment/targets/export).
11. PWA: manifest, service worker (Workbox via `next-pwa` or hand-rolled),
    offline outbox for workout/food logging.
12. Export/backup: CSV (workouts, food log, body weight) + full JSON
    backup/restore with validation.
13. Tests: Vitest unit suite (section 19), Playwright e2e for the critical
    flows.
14. Verification: lint, typecheck, unit tests, production build — fix all
    errors.
15. Documentation: README, ARCHITECTURE.md, ASSUMPTIONS.md, .env.example.

## 4. Key design decisions

- **Per-hand dumbbell weight** is the stored unit for all dumbbell exercises
  (bilateral and unilateral). Goblet/sumo squats store *total* weight held
  (one dumbbell, both hands) — flagged explicitly per exercise
  (`loadBasis: 'per_hand' | 'total'`).
- **25 kg safety cap** is enforced in the calculation engine
  (`lib/calc/safety.ts`), not just the UI, so it cannot be bypassed by any
  caller (demo or Supabase, manual override attempts are clamped and
  surfaced as a warning rather than silently dropped).
- **Progression engine** is pure and rule-based (section 10 of the spec),
  returns a `{ recommendation, reasonCodes[] }` structure so the UI can
  always show *why*.
- **Food parsing** never fabricates nutrition. Unmatched or low-confidence
  parses return candidate matches for the user to confirm; nothing is saved
  to the log until confirmed.
- **Offline-first**: all mutation calls go through the outbox first in
  Supabase mode; demo mode is inherently local so is "offline" by
  construction.

## 5. Risks / mitigations

- **No Node.js / network in the execution environment** — mitigated by
  installing Node LTS via `winget` (user-approved) before scaffolding.
- **No live Supabase project** — cannot execute migrations against a real
  instance or test magic-link email delivery. Mitigated by: complete,
  reviewable SQL migrations; a documented `supabase db push` step in
  README; demo mode as the fully-functional default so the app is usable
  without Supabase at all.
- **Full 70+ exercise / ~120 food metadata authoring is large** — mitigated
  by generating this as structured TS data files with a consistent schema,
  validated by Zod at import time (build fails if a seed record is
  malformed).
- **Playwright e2e requires a running browser** — installed via
  `npx playwright install`; run headless in CI-style invocation during
  verification.
- **Scope size** — this is intentionally a large build. Where a corner is
  cut to fit the session, it is recorded in `ASSUMPTIONS.md` rather than
  left as a silent TODO.

## 6. Out of scope for this pass (documented, not hidden)

See `ASSUMPTIONS.md` for the authoritative list.
