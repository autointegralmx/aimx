-- Operational / documentation quick fields for simplified admin capture.
-- Additive only: defaults preserve existing rows as "unknown" / empty.
-- Rollback: drop columns below and recreate vehicles_public without them.

alter table public.vehicles
  add column if not exists starts_status text not null default 'unknown'
    constraint vehicles_starts_status_check
      check (starts_status in ('yes', 'no', 'unknown')),
  add column if not exists drives_status text not null default 'unknown'
    constraint vehicles_drives_status_check
      check (drives_status in ('yes', 'no', 'unknown')),
  add column if not exists has_keys_status text not null default 'unknown'
    constraint vehicles_has_keys_status_check
      check (has_keys_status in ('yes', 'no', 'unknown')),
  add column if not exists airbags_status text not null default 'unknown'
    constraint vehicles_airbags_status_check
      check (airbags_status in ('intact', 'deployed', 'unknown')),
  add column if not exists invoice_type text not null default 'unknown'
    constraint vehicles_invoice_type_check
      check (
        invoice_type in (
          'aseguradora',
          'agencia',
          'empresa',
          'particular',
          'unknown'
        )
      ),
  add column if not exists invoice_entity text,
  add column if not exists tenencias_label text,
  add column if not exists verification_status text not null default 'unknown'
    constraint vehicles_verification_status_check
      check (
        verification_status in (
          'vigente',
          'no_vigente',
          'no_aplica',
          'unknown'
        )
      ),
  add column if not exists publish_observations boolean not null default true;

comment on column public.vehicles.starts_status is
  'Tri-state: yes | no | unknown. Default unknown — never assume starts.';
comment on column public.vehicles.drives_status is
  'Tri-state: yes | no | unknown. Default unknown.';
comment on column public.vehicles.has_keys_status is
  'Tri-state: yes | no | unknown. Default unknown.';
comment on column public.vehicles.airbags_status is
  'Airbag condition: intact | deployed | unknown.';
comment on column public.vehicles.invoice_type is
  'Invoice kind for public badges; unknown until confirmed.';
comment on column public.vehicles.invoice_entity is
  'Optional refacturación / razón social.';
comment on column public.vehicles.tenencias_label is
  'Short free label e.g. 2025, 2026.';
comment on column public.vehicles.verification_status is
  'Verification: vigente | no_vigente | no_aplica | unknown.';
comment on column public.vehicles.publish_observations is
  'When false, condition_notes stay internal and are omitted from public UI.';

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
  v.published_at,
  v.created_at
from public.vehicles v
where v.is_published = true
  and v.deleted_at is null
  and v.status in ('available', 'reserved');

comment on view public.vehicles_public is
  'Safe public projection of vehicles. Excludes vin, provider_reference, private_notes, internal_price, stock_code, audit actors.';

grant select on public.vehicles_public to anon, authenticated;
