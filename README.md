# Nithish Fit

A personal, mobile-first Progressive Web App for gym workout progression, Indian food
tracking, nutrition planning, and body-weight management — built for a single user
(Nithish) with a documented right-forearm safety restriction baked into the workout
generator and progression engine.

> This app provides general fitness and nutrition planning support. It does not replace
> advice from a qualified doctor, physiotherapist, trainer or dietitian.

## Features

- Auto-generated daily workout from a 4-day Upper/Lower programme, respecting available
  equipment and the 25kg right-hand safety cap (per-hand for dumbbells, total for
  goblet/sumo squats).
- Set-by-set logging with a rest timer, RIR, pain scoring, and previous-session /
  previous-week comparisons.
- Transparent, rule-based progressive-overload engine — every recommendation shows *why*.
- Searchable exercise directory (72 exercises) with wrist-load category, grip, safety
  notes, and substitutes.
- Deterministic natural-language Indian food logging ("3 eggs bhurji with 2 rotis") with
  confidence-scored matches, manual correction, and personal-alias learning — nothing is
  logged without a confirmed food match.
- Local Indian food database (121 items, 129 aliases) with recipe builder for
  oil/portion-accurate home cooking.
- 7-day Indian non-vegetarian meal plan generator with swap options.
- Body-weight tracking with a 7-day moving average, trend chart, and estimated
  target-weight date.
- CSV/JSON export and full JSON backup/restore.
- Installable PWA with offline app-shell caching; fully usable offline in local demo mode.

See [PLAN.md](PLAN.md) for the architecture plan, [ARCHITECTURE.md](ARCHITECTURE.md) for
how the codebase is organized, and [ASSUMPTIONS.md](ASSUMPTIONS.md) for documented scope
decisions made during the build.

## Tech stack

Next.js 16 (App Router) · TypeScript (strict) · React 19 · Tailwind CSS v4 · shadcn/ui ·
Supabase (Postgres + Auth) · Zod · React Hook Form · Recharts · IndexedDB (`idb`) · Vitest
· Playwright.

## Quick start (local demo mode — no external accounts needed)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. That's it — no environment variables, no database, no
signup. The app seeds itself with Nithish's profile, four weeks of realistic workout/food/
body-weight history, and a sample meal plan directly into your browser's IndexedDB on
first load. A "Local demo mode" banner confirms you're running without Supabase.

To remove the seeded sample data, go to **More → Settings → Data → Remove sample data**.

## Connecting Supabase (optional — for real persistence/sync)

Demo mode is fully functional on its own. Connect Supabase if you want your data synced
across devices instead of living only in one browser.

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local` and fill in the two `NEXT_PUBLIC_SUPABASE_*`
   values from your project's **Settings → API** page.
3. Apply the schema. Either via the Supabase CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   or by pasting the files in `supabase/migrations/` (in numeric order, `0001_...` through
   `0011_rls.sql`) into the Supabase SQL Editor.
4. Seed the global reference data (exercise directory + food database). There is no
   pre-generated `seed.sql` in this repo — generate one from the TypeScript seed source
   with:
   ```bash
   npm run seed:check   # validates db/seed/*.ts against the zod schemas first
   ```
   then adapt `db/seed/exercises.ts` / `db/seed/foods.ts` into insert statements for your
   `exercises` / `food_items` (+ alias/serving) tables, or write a one-off script using
   `@supabase/supabase-js` with the service-role key to `upsert()` those arrays directly.
   This step is intentionally left as a script you run once against your own project
   rather than a committed SQL data dump, since exercise/food reference data is exactly
   the kind of thing you may want to curate before syncing.
5. Restart the dev server. Sign up / sign in with email (magic link or password, per your
   Supabase Auth settings) — the app switches out of demo mode automatically once both env
   vars are present.

If either `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, the
app always falls back to local demo mode rather than failing to start.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server at <http://localhost:3000> |
| `npm run build` | Production build |
| `npm start` | Run the production build (`npm run build` first) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | End-to-end tests (Playwright; run `npx playwright install chromium` once first) |
| `npm run seed:check` | Validates every `db/seed/*.ts` record against its zod schema |
| `npm run format` | Prettier |

## Testing

```bash
npm run typecheck
npm test              # 87 unit tests covering BMR/TDEE/macros, the progression engine,
                       # the 25kg safety cap, deload rules, the food parser, moving
                       # averages, recipe math, etc. — see tests/unit/
npx playwright install chromium   # one-time browser download
npm run test:e2e      # 11 Playwright specs covering onboarding, a full workout
                       # (set logging + pain handling), the safety cap surfacing in the
                       # UI, food logging + correction, meal-plan generation, body-weight
                       # logging, and data export — see tests/e2e/
npm run build
```

## Deployment

### Vercel (app)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import it into [Vercel](https://vercel.com/new).
3. Framework preset: Next.js (auto-detected).
4. Add the environment variables from `.env.example` in the Vercel project settings if
   you're connecting Supabase (leave them unset to deploy in demo mode).
5. Deploy. Vercel runs `npm run build` automatically.

### Supabase (database)

Provision the project and run the migrations as described above under "Connecting
Supabase" — do this before or after the Vercel deploy, they're independent. Update the
Vercel environment variables and redeploy (or just wait for the next deploy) once the
Supabase project is ready.

### Environment variables required

See `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL` — optional, enables Supabase mode when set together with the anon key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — optional, see above
- `SUPABASE_SERVICE_ROLE_KEY` — optional, only for server-side seed/maintenance scripts, never exposed to the browser

## Privacy and data

- Demo mode: all data lives in this browser's IndexedDB. Nothing is uploaded anywhere.
- Supabase mode: data is scoped to your account via row-level security
  (`supabase/migrations/0011_rls.sql`); no analytics or advertising trackers are included.
- Export your data anytime from **More → Export & backup** (CSV per data type, or a full
  JSON backup with restore).
- Delete all sample/demo data from **More → Settings**.

## Medical disclaimer

This app supports general fitness and nutrition planning. It does not diagnose, treat, or
replace professional medical, physiotherapy, coaching, or dietetic advice. The built-in
right-forearm safety rules (25kg cap, pain-gated progression) are configured based on
information provided by the user and are not a substitute for guidance from a qualified
doctor or physiotherapist.
