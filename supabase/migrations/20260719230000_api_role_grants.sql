-- API role privileges for public schema tables/views.
-- RLS remains the access control layer; without GRANTs, PostgREST cannot read rows.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to postgres;

grant usage, select on all sequences in schema public to anon, authenticated, service_role;

grant execute on all functions in schema public to anon, authenticated, service_role;

-- Ensure future tables follow the same defaults for the migration role
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;

-- Public vehicle projection
grant select on public.vehicles_public to anon, authenticated, service_role;
