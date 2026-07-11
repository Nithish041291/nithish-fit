-- User profile, preferences and medical restrictions.
-- Single-user app: user_id references auth.users(id); RLS (0011) scopes every row to auth.uid().

create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  name text not null,
  sex text not null check (sex in ('male', 'female')),
  age integer not null check (age between 10 and 100),
  height_cm numeric(5,1) not null check (height_cm between 50 and 250),
  current_weight_kg numeric(5,2) not null check (current_weight_kg between 30 and 300),
  target_weight_kg numeric(5,2) not null check (target_weight_kg between 30 and 300),
  primary_goal text not null check (primary_goal in ('fat_loss', 'muscle_gain', 'maintenance', 'recomposition')),
  training_experience text not null check (training_experience in ('beginner', 'intermediate', 'advanced')),
  country text not null default 'India',
  dietary_pattern text not null check (dietary_pattern in ('indian_vegetarian', 'indian_non_vegetarian', 'indian_eggetarian', 'other')),
  training_days text[] not null default '{}',
  rest_days text[] not null default '{}',
  gym_type text not null,
  preferred_workout_duration_min_minutes integer not null,
  preferred_workout_duration_max_minutes integer not null,
  creatine_grams_per_day numeric(4,1) not null default 0,
  whey_scoops_per_training_day numeric(3,1) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_user_profiles_updated_at before update on user_profiles
  for each row execute function set_updated_at();

create table user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  units text not null default 'metric',
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  activity_level text not null check (activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'custom')),
  custom_activity_multiplier numeric(3,2),
  calorie_deficit_percent numeric(4,1) not null default 17.5,
  protein_grams_per_kg numeric(3,2) not null default 1.9,
  fat_grams_per_kg_target numeric(3,2) not null default 0.8,
  fibre_target_grams_min integer not null default 30,
  fibre_target_grams_max integer not null default 40,
  water_target_ml integer not null default 3000,
  updated_at timestamptz not null default now()
);
create trigger trg_user_preferences_updated_at before update on user_preferences
  for each row execute function set_updated_at();

create table medical_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  description text not null,
  body_part text not null,
  max_load_per_hand_kg numeric(5,2),
  active boolean not null default true,
  since date not null,
  notes text,
  created_at timestamptz not null default now()
);
create index idx_medical_restrictions_user on medical_restrictions(user_id) where active;

create table application_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);
create trigger trg_application_settings_updated_at before update on application_settings
  for each row execute function set_updated_at();
