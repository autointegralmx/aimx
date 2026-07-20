-- Allow active staff to hard-delete vehicles.
-- Without this policy, DELETE matches 0 rows under RLS and the vehicle remains.

create policy vehicles_delete_staff
  on public.vehicles for delete
  to authenticated
  using (public.is_staff());

comment on policy vehicles_delete_staff on public.vehicles is
  'Staff may permanently delete vehicle rows. Cascades vehicle_media; leads.vehicle_id SET NULL.';
