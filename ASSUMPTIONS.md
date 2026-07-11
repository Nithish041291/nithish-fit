# Assumptions

Documented per the build instructions instead of leaving silent gaps or
placeholder TODOs. None of these block the acceptance criteria in section 20
of the brief; they are reasonable defaults for a single-user personal app.

## Environment

- **No live Supabase project exists.** The app ships complete SQL
  migrations, RLS policies, and a Supabase client integration, but they have
  not been executed against a real Supabase instance (no credentials were
  provided, per spec section 5's instruction to support demo mode without
  external keys). Demo mode (IndexedDB, browser-local) is the default and is
  fully functional end-to-end. Connecting Supabase is a documented
  `README.md` step (`supabase db push` + env vars).
- **Node.js was not pre-installed** on the build machine; it was installed
  via `winget install OpenJS.NodeJS.LTS --scope user` with explicit user
  approval, so `npm`/`npx` are available for build/test/lint.
- **Playwright e2e tests** are written but require `npx playwright install`
  (downloads browser binaries) to execute; this is a one-time setup step
  documented in the README.

## Product behaviour

- **Single user, single identity.** Demo mode auto-authenticates a local
  "Nithish" profile; there is no multi-account switcher. Supabase mode uses
  one real auth user (email magic link or password) — RLS policies key off
  `auth.uid()` but the UI never exposes account switching.
- **Video-link field** is a plain URL text field on each exercise (per spec
  "can be populated later") — no video hosting/embedding is implemented,
  just storage + optional display of a link if present.
- **Progress photograph metadata** is stored (date, caption, local file
  name) without any binary image upload/storage, per spec §6I ("without
  requiring cloud image storage"). No photo file storage (local or cloud) is
  implemented in this pass.
- **AI-assisted food parsing provider interface** exists
  (`lib/food-parser/provider.ts`) but only the deterministic parser is
  wired up, per spec §13 ("do not require an external language-model API for
  the core application"). No LLM API key is called anywhere in the app.
- **Nutrition data source** is a hand-curated local seed dataset (~120 Indian
  food entries with aliases, generic/estimated values clearly labelled with
  `source: 'estimated'` and a reliability level) — not scraped or copied from
  a proprietary database, per spec §6F. A `NutritionProvider` interface
  exists for wiring a licensed API (USDA/Edamam/Nutritionix) later.
- **Workout duration estimate** is computed from set count × average
  time-per-set + rest periods (a simple heuristic), not a machine-learned
  model.
- **"Deload" and "readiness" recommendations** are conservative, rule-based,
  and always require explicit user acceptance (accept/postpone/disable) —
  never auto-applied silently, per spec §10/§11.
- **Exercise seed count**: 70 exercises are seeded (meets the "at least 70"
  requirement in spec §6D), each with the full field set required
  (muscles, equipment, wrist-loading, grip, substitutes, etc.). Only
  equipment-compatible, medically-appropriate exercises are flagged
  `isSelectableByDefault: true`; the rest exist in the directory for
  browsing/future equipment changes.
- **Meal plan variety**: the 7-day generator selects from a bank of ~10
  breakfast/lunch/dinner templates per cuisine style to avoid repeating the
  same day twice in a row; it is not a fully unique 7×8-meal hand-authored
  set for every possible preference combination.

- **Seeded nutrition target reconciliation**: the spec lists both "current target in use"
  (~2250 kcal / 180g protein) and a "default moderate deficit of 15-20%" for *new*
  calculations. These don't land on the same number at a moderately-active multiplier
  (2250 kcal implies ~24% off a 2959 kcal maintenance). The seed treats the ~2250/180g
  figures as the pre-existing target Nithish already uses (`isUserOverride: true`), while
  the calculator elsewhere defaults to a fresh 17.5% deficit for anything recalculated —
  matching spec §7's instruction that recalculation requires explicit user confirmation
  before replacing an active target.

## Technical

- **Next.js 15 / React 19** are used as the current stable major versions at
  build time (checked via `npm view` during scaffolding) to satisfy "modern,
  maintainable, mutually compatible stable releases."
- **PWA service worker** is implemented via `next-pwa`/Workbox-style
  precaching for the app shell plus a custom outbox in IndexedDB for
  offline workout/food logging — not a full offline-first cache-everything
  strategy (e.g. it does not cache dynamic chart images).
- **CSV/JSON export** runs client-side (Blob download) — there is no server
  email-export or scheduled backup job.
- **Row-level security** is defined in SQL against `auth.uid()` for the
  Supabase schema; since demo mode has no server, "RLS" there is enforced by
  the fact that IndexedDB is already origin-scoped to the browser.
