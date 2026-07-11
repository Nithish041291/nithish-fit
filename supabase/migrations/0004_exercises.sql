-- Exercise directory (global reference data, seeded once; readable by all authenticated users).

create table exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  primary_muscles text[] not null,
  secondary_muscles text[] not null default '{}',
  movement_pattern text not null,
  equipment text[] not null,
  is_compound boolean not null,
  is_unilateral boolean not null,
  load_basis text not null check (load_basis in ('per_hand', 'total', 'machine_stack', 'bodyweight')),
  setup_instructions text not null,
  execution_instructions text not null,
  breathing_guidance text not null,
  common_mistakes text[] not null default '{}',
  wrist_load_category text not null check (wrist_load_category in ('low', 'moderate', 'high')),
  recommended_grip text not null,
  per_hand_or_total_note text not null,
  safety_note text not null,
  contraindications text[] not null default '{}',
  per_hand_weight_limit_kg numeric(5,2),
  suggested_rep_range_low integer not null,
  suggested_rep_range_high integer not null,
  progression_method text not null,
  substitute_exercise_slugs text[] not null default '{}',
  video_url text,
  is_selectable_by_default boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_exercises_updated_at before update on exercises
  for each row execute function set_updated_at();
create index idx_exercises_primary_muscles on exercises using gin (primary_muscles);
create index idx_exercises_equipment on exercises using gin (equipment);
create index idx_exercises_movement_pattern on exercises(movement_pattern);

create table exercise_aliases (
  id uuid primary key default gen_random_uuid(),
  exercise_slug text not null references exercises(slug) on delete cascade,
  alias text not null
);
create index idx_exercise_aliases_slug on exercise_aliases(exercise_slug);
create index idx_exercise_aliases_alias on exercise_aliases(lower(alias));

create table exercise_substitutions (
  id uuid primary key default gen_random_uuid(),
  exercise_slug text not null references exercises(slug) on delete cascade,
  substitute_slug text not null references exercises(slug) on delete cascade,
  reason text not null
);
create index idx_exercise_substitutions_slug on exercise_substitutions(exercise_slug);
