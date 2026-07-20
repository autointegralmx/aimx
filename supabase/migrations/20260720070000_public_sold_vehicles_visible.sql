-- Keep sold vehicles visible on public catalog with a "Vendido" badge.
-- Additive: constraint + trigger + view. No data deletion.

-- Allow published + sold (still block draft/archived/deleted).
alter table public.vehicles
  drop constraint if exists vehicles_published_requires_available;

alter table public.vehicles
  add constraint vehicles_published_requires_listable_status check (
    is_published = false
    or (
      status in ('available', 'reserved', 'sold')
      and deleted_at is null
    )
  );

-- Sold stays public; only draft/archived/deleted force unpublish.
-- Sold cannot be in auction.
create or replace function public.vehicles_normalize_publication_flags()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'draft' then
    new.is_published := false;
    new.is_weekly_opportunity := false;
  elsif new.status = 'sold' then
    new.is_weekly_opportunity := false;
  elsif new.status = 'archived' then
    new.is_published := false;
    new.is_weekly_opportunity := false;
    new.is_featured := false;
  end if;

  if new.is_weekly_opportunity = true then
    if new.is_published is distinct from true
       or new.status not in ('available', 'reserved')
       or new.deleted_at is not null then
      new.is_weekly_opportunity := false;
    end if;
  end if;

  if new.deleted_at is not null then
    new.is_published := false;
    new.is_weekly_opportunity := false;
    new.is_featured := false;
  end if;

  return new;
end;
$$;

drop view if exists public.vehicles_public;

create view public.vehicles_public
with (security_invoker = true)
as
select
  v.id,
  v.slug,
  v.category,
  v.make,
  v.model,
  v.version,
  v.year,
  v.body_type,
  v.mileage_km,
  v.transmission,
  v.fuel_type,
  v.exterior_color,
  v.public_title,
  v.short_description,
  coalesce(v.full_description, v.public_description) as full_description,
  v.price_amount,
  v.price_label,
  v.currency,
  v.status,
  v.is_featured,
  v.is_weekly_opportunity,
  v.opportunity_deadline,
  v.featured_order,
  v.damage_summary,
  v.condition_notes,
  v.damage_tags,
  v.public_tags,
  v.location_label,
  v.seo_title,
  v.seo_description,
  v.starts_status,
  v.drives_status,
  v.has_keys_status,
  v.airbags_status,
  v.invoice_type,
  v.invoice_entity,
  v.tenencias_label,
  v.verification_status,
  v.publish_observations,
  v.use_manual_public_copy,
  v.published_at,
  v.created_at
from public.vehicles v
where v.is_published = true
  and v.deleted_at is null
  and v.status in ('available', 'reserved', 'sold');

comment on view public.vehicles_public is
  'Safe public projection. Includes available, reserved (apartado) and sold units for catalog history.';

grant select on public.vehicles_public to anon, authenticated;

-- Re-show already-sold units that were auto-unpublished by the old rule.
update public.vehicles
set is_published = true
where status = 'sold'
  and deleted_at is null
  and is_published = false;
