-- Closed-auction award amount (historial). Closed state stays derived from
-- is_weekly_opportunity + opportunity_deadline <= now (no boolean column).

alter table public.vehicles
  add column if not exists auction_awarded_amount numeric(14, 2) null;

comment on column public.vehicles.auction_awarded_amount is
  'Monto final de adjudicación de una subasta cerrada. Null = pendiente. Independiente de price_amount e internal_price.';

alter table public.vehicles
  drop constraint if exists vehicles_auction_awarded_amount_non_negative;

alter table public.vehicles
  add constraint vehicles_auction_awarded_amount_non_negative check (
    auction_awarded_amount is null or auction_awarded_amount >= 0
  );

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
  v.auction_awarded_amount,
  v.featured_order,
  v.catalog_order,
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

grant select on public.vehicles_public to anon, authenticated;
