-- Manual catalog order for public listings (lower = first).
-- Admin arrows + public category/auction pages use catalog_order.

alter table public.vehicles
  add column if not exists catalog_order integer not null default 1000;

comment on column public.vehicles.catalog_order is
  'Display order on public site. Lower values appear first. Tie-break: published_at desc.';

-- Backfill: newer published first within each category / auction channel.
with ranked as (
  select
    id,
    row_number() over (
      partition by
        is_weekly_opportunity,
        case when is_weekly_opportunity then null else category end
      order by
        coalesce(published_at, created_at) desc nulls last,
        created_at desc
    ) as rn
  from public.vehicles
  where deleted_at is null
)
update public.vehicles v
set catalog_order = ranked.rn
from ranked
where v.id = ranked.id;

create index if not exists vehicles_catalog_order_owned_idx
  on public.vehicles (category, catalog_order, published_at desc)
  where deleted_at is null and is_weekly_opportunity = false;

create index if not exists vehicles_catalog_order_auction_idx
  on public.vehicles (catalog_order, opportunity_deadline, published_at desc)
  where deleted_at is null and is_weekly_opportunity = true;

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
