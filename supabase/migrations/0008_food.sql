-- Indian food database: items, servings, aliases, recipes, and the food log.

create table food_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  cuisine_tag text,
  raw_cooked_state text not null check (raw_cooked_state in ('raw', 'cooked', 'not_applicable')),
  preparation_method text,
  calories_per_100g numeric(6,2) not null,
  protein_per_100g numeric(5,2) not null,
  carbs_per_100g numeric(5,2) not null,
  fat_per_100g numeric(5,2) not null,
  fibre_per_100g numeric(5,2) not null,
  source text not null,
  measurement_basis text not null,
  reliability text not null check (reliability in ('verified', 'estimated', 'user_provided')),
  last_updated date not null,
  is_custom boolean not null default false,
  owner_user_id uuid references auth.users(id) on delete cascade,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_food_items_category on food_items(category);
create index idx_food_items_owner on food_items(owner_user_id);
create index idx_food_items_name_trgm on food_items using gin (to_tsvector('simple', name));

create table food_servings (
  id uuid primary key default gen_random_uuid(),
  food_item_id uuid not null references food_items(id) on delete cascade,
  unit text not null,
  grams_equivalent numeric(7,2) not null,
  label text not null,
  is_default boolean not null default false
);
create index idx_food_servings_item on food_servings(food_item_id);

create table food_aliases (
  id uuid primary key default gen_random_uuid(),
  food_item_id uuid not null references food_items(id) on delete cascade,
  alias text not null,
  is_user_correction boolean not null default false,
  owner_user_id uuid references auth.users(id) on delete cascade
);
create index idx_food_aliases_item on food_aliases(food_item_id);
create index idx_food_aliases_alias on food_aliases(lower(alias));

create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cuisine_tag text,
  total_cooked_weight_grams numeric(7,2) not null,
  servings numeric(4,1) not null,
  cooking_oil_grams numeric(6,2) not null default 0,
  instructions text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_recipes_updated_at before update on recipes
  for each row execute function set_updated_at();
create index idx_recipes_user on recipes(user_id) where deleted_at is null;

create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  food_item_id uuid not null references food_items(id),
  quantity_grams numeric(7,2) not null,
  note text
);
create index idx_recipe_ingredients_recipe on recipe_ingredients(recipe_id);

create table food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  logged_at timestamptz not null default now(),
  raw_text text not null,
  food_item_id uuid references food_items(id),
  recipe_id uuid references recipes(id),
  custom_name text,
  quantity_grams numeric(7,2) not null,
  unit text not null,
  unit_quantity numeric(6,2) not null,
  meal_slot text not null check (meal_slot in ('early_morning','breakfast','mid_morning','lunch','pre_workout','post_workout','dinner','before_bed','unspecified')),
  calories numeric(6,1) not null,
  protein_g numeric(5,1) not null,
  carbs_g numeric(5,1) not null,
  fat_g numeric(5,1) not null,
  fibre_g numeric(5,1) not null,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  source text not null,
  was_edited boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_food_logs_user_date on food_logs(user_id, date desc);
