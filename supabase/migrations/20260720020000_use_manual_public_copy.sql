-- Explicit opt-in for legacy manual public copy (title, descriptions, price label, SEO, tags).
-- Default false: structured fields drive public surfaces.
-- Additive only. Rollback: drop column and recreate vehicles_public without it.

alter table public.vehicles
  add column if not exists use_manual_public_copy boolean not null default false;

comment on column public.vehicles.use_manual_public_copy is
  'When true, public UI may use manual public_title / descriptions / price_label / SEO / public_tags. Default false — structured data wins.';

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
  and v.status in ('available', 'reserved');

comment on view public.vehicles_public is
  'Safe public projection of vehicles. Excludes vin, provider_reference, private_notes, internal_price, stock_code, audit actors.';

grant select on public.vehicles_public to anon, authenticated;
