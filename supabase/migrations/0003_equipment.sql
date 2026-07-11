-- Equipment catalogue (global reference data) + per-user enable/disable + weight increments.

create table equipment (
  id uuid primary key default gen_random_uuid(),
  type text not null unique,
  name text not null,
  notes text
);

create table user_equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  equipment_id uuid not null references equipment(id) on delete cascade,
  enabled boolean not null default true,
  max_load_kg numeric(6,2),
  updated_at timestamptz not null default now(),
  unique (user_id, equipment_id)
);
create trigger trg_user_equipment_updated_at before update on user_equipment
  for each row execute function set_updated_at();
create index idx_user_equipment_user on user_equipment(user_id);

create table available_weight_increments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  equipment_type text not null,
  increment_kg numeric(4,2) not null,
  min_kg numeric(5,2) not null default 0,
  max_kg numeric(5,2) not null,
  unique (user_id, equipment_type)
);
