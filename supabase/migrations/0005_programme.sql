-- Workout programme structure: programme -> days -> planned exercises.

create table workout_programmes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default false,
  started_on date not null,
  cycle_weeks integer not null default 5,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_workout_programmes_updated_at before update on workout_programmes
  for each row execute function set_updated_at();
create index idx_workout_programmes_user on workout_programmes(user_id) where deleted_at is null;

create table workout_days (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references workout_programmes(id) on delete cascade,
  label text not null,
  weekday text check (weekday in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  is_rest_day boolean not null default false,
  order_index integer not null default 0
);
create index idx_workout_days_programme on workout_days(programme_id);

create table planned_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references workout_days(id) on delete cascade,
  exercise_slug text not null references exercises(slug),
  order_index integer not null default 0,
  target_sets integer not null,
  target_reps_low integer not null,
  target_reps_high integer not null,
  rest_seconds integer not null default 90,
  notes text
);
create index idx_planned_exercises_day on planned_exercises(workout_day_id);
