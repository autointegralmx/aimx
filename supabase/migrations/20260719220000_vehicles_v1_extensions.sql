-- Incremental: vehicles V1 extensions (opportunities flags, public/private fields, tags)
-- Does NOT modify 20260719190000_initial_vertical_cut.sql
-- Aligns with docs/DATABASE_ARCHITECTURE.md decisions A1 + opportunities-on-vehicles

-- ---------------------------------------------------------------------------
-- New columns on vehicles
-- ---------------------------------------------------------------------------

alter table public.vehicles
  add column if not exists stock_code text,
  add column if not exists body_type text,
  add column if not exists public_title text,
  add column if not exists full_description text,
  add column if not exists price_label text,
  add column if not exists damage_summary text,
  add column if not exists condition_notes text,
  add column if not exists damage_tags text[] not null default '{}'::text[],
  add column if not exists public_tags text[] not null default '{}'::text[],
  add column if not exists is_weekly_opportunity boolean not null default false,
  add column if not exists opportunity_deadline timestamptz,
  add column if not exists featured_order integer,
  add column if not exists provider_reference text,
  add column if not exists internal_price numeric(12, 2),
  add column if not exists seo_title text,
  add column if not exists seo_description text;

comment on column public.vehicles.stock_code is 'Optional internal folio; unique when present';
comment on column public.vehicles.public_title is 'Public display title';
comment on column public.vehicles.full_description is 'Long public description; short_description remains the teaser';
comment on column public.vehicles.price_amount is 'Public price (MXN); optional';
comment on column public.vehicles.price_label is 'Optional public price label (e.g. Solicita información)';
comment on column public.vehicles.is_weekly_opportunity is 'Shown on /oportunidades when published and active';
comment on column public.vehicles.is_featured is 'General featured placement (Home/listados)';
comment on column public.vehicles.public_description is 'Legacy long description; prefer full_description for new writes';

-- Unique stock_code when set (soft-deleted rows ignored)
create unique index if not exists vehicles_stock_code_unique_idx
  on public.vehicles (stock_code)
  where stock_code is not null and deleted_at is null;

-- ---------------------------------------------------------------------------
-- Controlled arrays (no free-form values)
-- ---------------------------------------------------------------------------

alter table public.vehicles
  drop constraint if exists vehicles_damage_tags_allowed,
  drop constraint if exists vehicles_public_tags_allowed,
  drop constraint if exists vehicles_featured_order_non_negative,
  drop constraint if exists vehicles_internal_price_non_negative,
  drop constraint if exists vehicles_opportunity_requires_published,
  drop constraint if exists vehicles_sold_no_opportunity,
  drop constraint if exists vehicles_archived_no_promo,
  drop constraint if exists vehicles_draft_no_promo;

alter table public.vehicles
  add constraint vehicles_damage_tags_allowed check (
    damage_tags <@ array[
      'defensa_delantera',
      'defensa_trasera',
      'cofre',
      'cajuela',
      'salpicadera_izquierda',
      'salpicadera_derecha',
      'puerta_izquierda',
      'puerta_derecha',
      'techo',
      'parabrisas',
      'suspension',
      'motor',
      'bolsas_de_aire',
      'dano_lateral',
      'dano_frontal',
      'dano_trasero',
      'inundacion',
      'incendio',
      'otro'
    ]::text[]
  );

alter table public.vehicles
  add constraint vehicles_public_tags_allowed check (
    public_tags <@ array[
      'excelente_oportunidad',
      'bajo_kilometraje',
      'precio_atractivo',
      'recien_publicado',
      'muy_solicitado'
    ]::text[]
  );

alter table public.vehicles
  add constraint vehicles_featured_order_non_negative check (
    featured_order is null or featured_order >= 0
  );

alter table public.vehicles
  add constraint vehicles_internal_price_non_negative check (
    internal_price is null or internal_price >= 0
  );

-- Opportunity only when published + available/reserved + not deleted
alter table public.vehicles
  add constraint vehicles_opportunity_requires_published check (
    is_weekly_opportunity = false
    or (
      is_published = true
      and status in ('available', 'reserved')
      and deleted_at is null
    )
  );

alter table public.vehicles
  add constraint vehicles_sold_no_opportunity check (
    status <> 'sold' or is_weekly_opportunity = false
  );

alter table public.vehicles
  add constraint vehicles_archived_no_promo check (
    status <> 'archived'
    or (is_featured = false and is_weekly_opportunity = false)
  );

alter table public.vehicles
  add constraint vehicles_draft_no_promo check (
    status <> 'draft'
    or (
      is_published = false
      and is_weekly_opportunity = false
    )
  );

-- Existing publish constraint already requires available|reserved + not deleted.
-- Keep it; draft/sold/archived cannot publish.

-- ---------------------------------------------------------------------------
-- Normalize flags on status change (server-side safety net)
-- ---------------------------------------------------------------------------

create or replace function public.vehicles_normalize_publication_flags()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'draft' then
    new.is_published := false;
    new.is_weekly_opportunity := false;
  elsif new.status = 'sold' then
    new.is_published := false;
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

drop trigger if exists vehicles_normalize_publication_flags on public.vehicles;
create trigger vehicles_normalize_publication_flags
before insert or update on public.vehicles
for each row execute function public.vehicles_normalize_publication_flags();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists vehicles_opportunities_public_idx
  on public.vehicles (
    featured_order asc nulls last,
    opportunity_deadline asc nulls last,
    published_at desc nulls last,
    created_at desc
  )
  where deleted_at is null
    and is_published = true
    and is_weekly_opportunity = true
    and status in ('available', 'reserved');

create index if not exists vehicles_category_public_idx
  on public.vehicles (category, published_at desc)
  where deleted_at is null and is_published = true;

create index if not exists vehicles_featured_public_idx
  on public.vehicles (is_featured, published_at desc)
  where deleted_at is null and is_published = true and is_featured = true;

-- ---------------------------------------------------------------------------
-- Public view (never expose private columns)
-- ---------------------------------------------------------------------------

create or replace view public.vehicles_public
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
  v.published_at,
  v.created_at
from public.vehicles v
where v.is_published = true
  and v.deleted_at is null
  and v.status in ('available', 'reserved');

comment on view public.vehicles_public is
  'Safe public projection of vehicles. Excludes vin, provider_reference, private_notes, internal_price, stock_code, audit actors.';
