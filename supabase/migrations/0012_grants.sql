-- Grants: tables created via the SQL editor as the `postgres` role don't automatically
-- pick up PostgREST-visible privileges the way tables created through the Supabase
-- dashboard table editor do. Row Level Security policies only take effect once the
-- underlying Postgres GRANT exists — without this, every request (including from the
-- service_role key) fails with "permission denied for table X" before RLS is even
-- evaluated.
grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

-- Ensure any tables added by future migrations get the same treatment automatically.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
