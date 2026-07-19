-- First vertical cut: inventory + leads + media + admin + settings
-- Aligns with docs/DATABASE_ARCHITECTURE.md v0.1.0

create extension if not exists "pgcrypto";

create type public.admin_role as enum ('admin', 'editor');

create type public.vehicle_category as enum (
  'accidentado',
  'recuperado',
  'seminuevo'
);

create type public.vehicle_status as enum (
  'draft',
  'available',
  'reserved',
  'sold',
  'archived'
);

create type public.lead_status as enum (
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
  'spam',
  'archived'
);

create type public.business_unit as enum (
  'inventory',
  'opportunities',
  'workshop',
  'keys',
  'general'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.admin_role not null default 'editor',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_admin_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.admin_role, 'editor')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_admin_user();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles p
    where p.id = auth.uid()
      and p.is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role = 'admin'
  );
$$;

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  object_path text not null,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text text,
  checksum text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.admin_profiles (id) on delete set null,
  deleted_at timestamptz,
  unique (bucket, object_path)
);

create index media_assets_created_at_idx on public.media_assets (created_at desc);

-- Decision: make/model/version as normalized text (no brand catalog in cut 1).
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  category public.vehicle_category not null,
  make text not null,
  model text not null,
  version text,
  year integer not null check (year >= 1950 and year <= 2100),
  mileage_km integer check (mileage_km is null or mileage_km >= 0),
  transmission text,
  fuel_type text,
  exterior_color text,
  price_amount numeric(12, 2) check (price_amount is null or price_amount >= 0),
  currency text not null default 'MXN',
  status public.vehicle_status not null default 'draft',
  is_published boolean not null default false,
  is_featured boolean not null default false,
  short_description text,
  public_description text,
  private_notes text,
  location_label text,
  vin text,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.admin_profiles (id) on delete set null,
  updated_by uuid references public.admin_profiles (id) on delete set null,
  deleted_at timestamptz,
  constraint vehicles_slug_unique unique (slug),
  constraint vehicles_published_requires_available check (
    is_published = false
    or (
      status in ('available', 'reserved')
      and deleted_at is null
    )
  )
);

create index vehicles_public_list_idx
  on public.vehicles (is_published, is_featured, published_at desc)
  where deleted_at is null and is_published = true;

create index vehicles_admin_status_idx on public.vehicles (status, updated_at desc)
  where deleted_at is null;

create index vehicles_make_model_idx on public.vehicles (make, model);

create trigger vehicles_set_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

create table public.vehicle_media (
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  media_asset_id uuid not null references public.media_assets (id) on delete restrict,
  position integer not null default 0 check (position >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (vehicle_id, media_asset_id)
);

create unique index vehicle_media_one_cover_idx
  on public.vehicle_media (vehicle_id)
  where is_cover = true;

create index vehicle_media_order_idx on public.vehicle_media (vehicle_id, position);

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  public_name text not null default 'Auto Integral',
  canonical_domain text not null default 'https://autointegral.mx',
  general_phone text,
  default_whatsapp_number text not null default '520000000000',
  inventory_whatsapp_number text,
  primary_location text not null default 'Ciudad de México y Área Metropolitana',
  default_currency text not null default 'MXN',
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.admin_profiles (id) on delete set null
);

insert into public.site_settings (id) values (1);

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  business_unit public.business_unit not null default 'inventory',
  vehicle_id uuid references public.vehicles (id) on delete set null,
  source_page text not null,
  name text not null,
  phone text not null,
  email text,
  message text,
  status public.lead_status not null default 'new',
  idempotency_key text not null unique,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status);
create index leads_vehicle_id_idx on public.leads (vehicle_id);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.admin_profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index audit_events_created_at_idx on public.audit_events (created_at desc);

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
  v.mileage_km,
  v.transmission,
  v.fuel_type,
  v.exterior_color,
  v.price_amount,
  v.currency,
  v.status,
  v.is_featured,
  v.short_description,
  v.public_description,
  v.location_label,
  v.published_at
from public.vehicles v
where v.is_published = true
  and v.deleted_at is null
  and v.status in ('available', 'reserved');

create or replace function public.create_public_vehicle_lead(
  p_vehicle_id uuid,
  p_source_page text,
  p_name text,
  p_phone text,
  p_email text default null,
  p_message text default null,
  p_idempotency_key text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_user_agent text default null
)
returns table (
  public_reference text,
  created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehicle public.vehicles%rowtype;
  v_key text;
  v_ref text;
  v_existing public.leads%rowtype;
  v_name text;
  v_phone text;
begin
  v_name := nullif(trim(p_name), '');
  v_phone := nullif(trim(p_phone), '');

  if v_name is null or char_length(v_name) < 2 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  if v_phone is null or char_length(v_phone) < 10 then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  if p_source_page is null or length(trim(p_source_page)) = 0 then
    raise exception 'invalid_source_page' using errcode = '22023';
  end if;

  select * into v_vehicle
  from public.vehicles
  where id = p_vehicle_id
    and is_published = true
    and deleted_at is null
    and status in ('available', 'reserved');

  if not found then
    raise exception 'vehicle_not_available' using errcode = '22023';
  end if;

  v_key := coalesce(nullif(trim(p_idempotency_key), ''), gen_random_uuid()::text);

  select * into v_existing from public.leads where idempotency_key = v_key;
  if found then
    return query select v_existing.public_reference, false;
    return;
  end if;

  v_ref := 'AI-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.leads (
    public_reference,
    business_unit,
    vehicle_id,
    source_page,
    name,
    phone,
    email,
    message,
    status,
    idempotency_key,
    utm_source,
    utm_medium,
    utm_campaign,
    user_agent
  ) values (
    v_ref,
    'inventory',
    p_vehicle_id,
    trim(p_source_page),
    v_name,
    v_phone,
    nullif(trim(p_email), ''),
    nullif(trim(p_message), ''),
    'new',
    v_key,
    nullif(trim(p_utm_source), ''),
    nullif(trim(p_utm_medium), ''),
    nullif(trim(p_utm_campaign), ''),
    nullif(trim(p_user_agent), '')
  );

  return query select v_ref, true;
end;
$$;

revoke all on function public.create_public_vehicle_lead from public;
grant execute on function public.create_public_vehicle_lead to anon, authenticated;

alter table public.admin_profiles enable row level security;
alter table public.media_assets enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_media enable row level security;
alter table public.site_settings enable row level security;
alter table public.leads enable row level security;
alter table public.audit_events enable row level security;

create policy admin_profiles_select_staff
  on public.admin_profiles for select
  to authenticated
  using (public.is_staff());

create policy admin_profiles_update_admin
  on public.admin_profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy vehicles_select_public
  on public.vehicles for select
  to anon, authenticated
  using (
    is_published = true
    and deleted_at is null
    and status in ('available', 'reserved')
  );

create policy vehicles_select_staff
  on public.vehicles for select
  to authenticated
  using (public.is_staff());

create policy vehicles_insert_staff
  on public.vehicles for insert
  to authenticated
  with check (public.is_staff());

create policy vehicles_update_staff
  on public.vehicles for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

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
        and v.status in ('available', 'reserved')
    )
  );

create policy media_assets_select_staff
  on public.media_assets for select
  to authenticated
  using (public.is_staff());

create policy media_assets_write_staff
  on public.media_assets for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy vehicle_media_select_public
  on public.vehicle_media for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_media.vehicle_id
        and v.is_published = true
        and v.deleted_at is null
        and v.status in ('available', 'reserved')
    )
  );

create policy vehicle_media_select_staff
  on public.vehicle_media for select
  to authenticated
  using (public.is_staff());

create policy vehicle_media_write_staff
  on public.vehicle_media for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy site_settings_select_public
  on public.site_settings for select
  to anon, authenticated
  using (true);

create policy site_settings_update_admin
  on public.site_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy leads_select_staff
  on public.leads for select
  to authenticated
  using (public.is_staff());

create policy leads_update_staff
  on public.leads for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy audit_events_select_admin
  on public.audit_events for select
  to authenticated
  using (public.is_admin());

create policy audit_events_insert_staff
  on public.audit_events for insert
  to authenticated
  with check (public.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-images',
  'vehicle-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy vehicle_images_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'vehicle-images');

create policy vehicle_images_staff_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'vehicle-images' and public.is_staff());

create policy vehicle_images_staff_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'vehicle-images' and public.is_staff())
  with check (bucket_id = 'vehicle-images' and public.is_staff());

create policy vehicle_images_staff_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'vehicle-images' and public.is_staff());
