-- Body measurements and nutrition targets.

create table body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,2) not null,
  waist_cm numeric(5,2),
  note text,
  photo_meta jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
create index idx_body_measurements_user_date on body_measurements(user_id, date desc);

create table nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  effective_from date not null,
  bmr_kcal numeric(6,1) not null,
  activity_level text not null,
  activity_multiplier numeric(3,2) not null,
  maintenance_kcal numeric(6,1) not null,
  deficit_percent numeric(4,1) not null,
  calorie_target_kcal numeric(6,1) not null,
  protein_target_g numeric(5,1) not null,
  fat_target_g numeric(5,1) not null,
  carb_target_g numeric(5,1) not null,
  fibre_target_g numeric(5,1) not null,
  is_active boolean not null default false,
  is_user_override boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_nutrition_targets_user_active on nutrition_targets(user_id) where is_active;
