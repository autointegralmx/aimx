-- HOTFIX: public RLS must allow sold rows (view uses security_invoker).
-- Without this, anon never sees Vendido units / their photos even if the view includes them.

drop policy if exists vehicles_select_public on public.vehicles;

create policy vehicles_select_public
  on public.vehicles for select
  to anon, authenticated
  using (
    is_published = true
    and deleted_at is null
    and status in ('available', 'reserved', 'sold')
  );

comment on policy vehicles_select_public on public.vehicles is
  'Public can read published available, reserved (apartado) and sold vehicles.';

drop policy if exists media_assets_select_public_via_published on public.media_assets;

create policy media_assets_select_public_via_published
  on public.media_assets for select
  to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from public.vehicle_media vm
      join public.vehicles v on v.id = vm.vehicle_id
      where vm.media_asset_id = media_assets.id
        and v.is_published = true
        and v.deleted_at is null
        and v.status in ('available', 'reserved', 'sold')
    )
  );

drop policy if exists vehicle_media_select_public on public.vehicle_media;

create policy vehicle_media_select_public
  on public.vehicle_media for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_media.vehicle_id
        and v.is_published = true
        and v.deleted_at is null
        and v.status in ('available', 'reserved', 'sold')
    )
  );
