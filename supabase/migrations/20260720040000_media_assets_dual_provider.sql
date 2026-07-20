-- Dual-provider media assets: Supabase Storage (legacy) + Cloudinary (new).
-- Additive and reversible. Does not migrate binary files.
-- Rollback notes at bottom.

alter table public.media_assets
  add column if not exists provider text not null default 'supabase',
  add column if not exists public_id text,
  add column if not exists resource_type text,
  add column if not exists version integer,
  add column if not exists secure_url text,
  add column if not exists format text;

-- Allow Cloudinary rows without Storage coordinates.
alter table public.media_assets
  alter column bucket drop not null;

alter table public.media_assets
  alter column object_path drop not null;

-- Drop prior provider check if re-applied; then add compatible dual-provider rules.
alter table public.media_assets
  drop constraint if exists media_assets_provider_check;

alter table public.media_assets
  drop constraint if exists media_assets_provider_fields_check;

alter table public.media_assets
  drop constraint if exists media_assets_version_positive_check;

alter table public.media_assets
  add constraint media_assets_provider_check
    check (provider in ('supabase', 'cloudinary'));

alter table public.media_assets
  add constraint media_assets_provider_fields_check
    check (
      (
        provider = 'supabase'
        and bucket is not null
        and length(trim(bucket)) > 0
        and object_path is not null
        and length(trim(object_path)) > 0
      )
      or
      (
        provider = 'cloudinary'
        and public_id is not null
        and length(trim(public_id)) > 0
      )
    );

alter table public.media_assets
  add constraint media_assets_version_positive_check
    check (version is null or version > 0);

comment on column public.media_assets.provider is
  'Binary provider: supabase (legacy Storage) or cloudinary. Default supabase for existing rows.';

comment on column public.media_assets.public_id is
  'Cloudinary public_id — primary identity for Cloudinary delivery. Unique when set.';

comment on column public.media_assets.resource_type is
  'Cloudinary resource_type (typically image).';

comment on column public.media_assets.version is
  'Cloudinary asset version when known.';

comment on column public.media_assets.secure_url is
  'Informational Cloudinary secure_url snapshot; delivery must build from public_id.';

comment on column public.media_assets.format is
  'Cloudinary format (jpg, webp, etc.) when known.';

create index if not exists media_assets_provider_idx
  on public.media_assets (provider);

create unique index if not exists media_assets_public_id_unique_idx
  on public.media_assets (public_id)
  where public_id is not null;

-- Rollback (manual):
-- drop index if exists public.media_assets_public_id_unique_idx;
-- drop index if exists public.media_assets_provider_idx;
-- alter table public.media_assets drop constraint if exists media_assets_version_positive_check;
-- alter table public.media_assets drop constraint if exists media_assets_provider_fields_check;
-- alter table public.media_assets drop constraint if exists media_assets_provider_check;
-- update public.media_assets set bucket = coalesce(bucket, 'vehicle-images'), object_path = coalesce(object_path, 'legacy/' || id::text) where bucket is null or object_path is null;
-- alter table public.media_assets alter column bucket set not null;
-- alter table public.media_assets alter column object_path set not null;
-- alter table public.media_assets drop column if exists format;
-- alter table public.media_assets drop column if exists secure_url;
-- alter table public.media_assets drop column if exists version;
-- alter table public.media_assets drop column if exists resource_type;
-- alter table public.media_assets drop column if exists public_id;
-- alter table public.media_assets drop column if exists provider;
