-- Meal plans: plan -> days -> planned meals (items stored as jsonb since they're a
-- small denormalised list of {foodItemId|recipeId, name, quantityGrams, displayQuantity}).

create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null,
  preferences jsonb not null,
  target_calories numeric(6,1) not null,
  target_protein_g numeric(5,1) not null,
  target_fat_g numeric(5,1) not null,
  target_fibre_g numeric(5,1) not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_meal_plans_user on meal_plans(user_id) where deleted_at is null;

create table meal_plan_days (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references meal_plans(id) on delete cascade,
  day_index integer not null check (day_index between 0 and 6),
  date date,
  is_vegetarian_day boolean not null default false
);
create index idx_meal_plan_days_plan on meal_plan_days(meal_plan_id);

create table planned_meals (
  id uuid primary key default gen_random_uuid(),
  meal_plan_day_id uuid not null references meal_plan_days(id) on delete cascade,
  slot text not null check (slot in ('early_morning','breakfast','mid_morning','lunch','pre_workout','post_workout','dinner','before_bed')),
  title text not null,
  items jsonb not null,
  calories numeric(6,1) not null,
  protein_g numeric(5,1) not null,
  carbs_g numeric(5,1) not null,
  fat_g numeric(5,1) not null,
  fibre_g numeric(5,1) not null,
  preparation_guidance text not null,
  swap_options text[] not null default '{}'
);
create index idx_planned_meals_day on planned_meals(meal_plan_day_id);
