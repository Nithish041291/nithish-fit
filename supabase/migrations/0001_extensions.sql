-- Nithish Fit: extensions and shared helpers
create extension if not exists "pgcrypto";

-- Generic updated_at trigger used by most tables.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
