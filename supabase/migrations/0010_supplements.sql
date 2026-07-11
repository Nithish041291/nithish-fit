create table supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('creatine', 'whey')),
  amount text not null,
  taken boolean not null default false,
  taken_at timestamptz,
  unique (user_id, date, type)
);
create index idx_supplement_logs_user_date on supplement_logs(user_id, date desc);
