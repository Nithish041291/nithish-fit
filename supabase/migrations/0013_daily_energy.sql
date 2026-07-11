-- Daily calorie-burn totals synced in from a wearable (Apple Watch via the Health Auto
-- Export app's REST API automation, see README.md "Apple Watch calorie sync"). Written only
-- by the /api/health-import route using the service-role key, never directly by the browser.

create table daily_energy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  active_energy_kcal numeric not null default 0,
  resting_energy_kcal numeric,
  source text not null default 'apple_health',
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create trigger trg_daily_energy_logs_updated_at before update on daily_energy_logs
  for each row execute function set_updated_at();
create index idx_daily_energy_logs_user_date on daily_energy_logs(user_id, date);

alter table daily_energy_logs enable row level security;
create policy daily_energy_logs_all_own on daily_energy_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
