-- Add airbags_status value: repaired (Bolsas de aire reparadas).
-- Used for seminuevos with aesthetic-only work where bags were replaced/repaired.

alter table public.vehicles
  drop constraint if exists vehicles_airbags_status_check;

alter table public.vehicles
  add constraint vehicles_airbags_status_check
  check (airbags_status in ('intact', 'deployed', 'repaired', 'unknown'));

comment on column public.vehicles.airbags_status is
  'Airbag condition: intact | deployed | repaired | unknown.';
