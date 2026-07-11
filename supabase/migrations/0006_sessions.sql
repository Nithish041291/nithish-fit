-- Actual training sessions: readiness -> session -> per-exercise performance -> sets.

create table readiness_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  sleep_hours numeric(3,1) not null,
  energy_level integer not null check (energy_level between 1 and 5),
  muscle_soreness integer not null check (muscle_soreness between 1 and 5),
  wrist_pain integer not null check (wrist_pain between 0 and 10),
  stress_level integer not null check (stress_level between 1 and 5),
  created_at timestamptz not null default now()
);
create index idx_readiness_entries_user_date on readiness_entries(user_id, date desc);

create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  programme_id uuid references workout_programmes(id) on delete set null,
  workout_day_id uuid references workout_days(id) on delete set null,
  label text not null,
  date date not null,
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'skipped')),
  readiness_entry_id uuid references readiness_entries(id) on delete set null,
  session_difficulty integer check (session_difficulty between 1 and 10),
  wrist_pain_score integer check (wrist_pain_score between 0 and 10),
  notes text,
  is_deload boolean not null default false,
  duration_minutes numeric(5,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_workout_sessions_updated_at before update on workout_sessions
  for each row execute function set_updated_at();
create index idx_workout_sessions_user_date on workout_sessions(user_id, date desc);

create table exercise_performances (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_slug text not null references exercises(slug),
  order_index integer not null default 0,
  was_skipped boolean not null default false,
  was_replaced_by_slug text references exercises(slug),
  was_added_extra boolean not null default false,
  note text
);
create index idx_exercise_performances_session on exercise_performances(session_id);
create index idx_exercise_performances_slug on exercise_performances(exercise_slug);

create table exercise_sets (
  id uuid primary key default gen_random_uuid(),
  performance_id uuid not null references exercise_performances(id) on delete cascade,
  set_number integer not null,
  suggested_weight_kg numeric(5,2),
  actual_weight_kg numeric(5,2),
  suggested_reps integer,
  actual_reps integer,
  rir numeric(3,1),
  pain_score integer check (pain_score between 0 and 10),
  completed boolean not null default false,
  timestamp timestamptz not null default now(),
  note text
);
create index idx_exercise_sets_performance on exercise_sets(performance_id);
