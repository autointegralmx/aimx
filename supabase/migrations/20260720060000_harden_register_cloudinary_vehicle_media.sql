-- Harden register_cloudinary_vehicle_media: exact public_id path binding.
-- Additive: create or replace only. Does not alter table data.

create or replace function public.register_cloudinary_vehicle_media(
  p_asset_id uuid,
  p_vehicle_id uuid,
  p_actor_id uuid,
  p_public_id text,
  p_secure_url text,
  p_resource_type text,
  p_version integer,
  p_format text,
  p_width integer,
  p_height integer,
  p_byte_size integer,
  p_original_filename text,
  p_mime_type text,
  p_make_cover boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_position integer;
  v_has_cover boolean;
  v_is_cover boolean;
  v_expected_public_id text;
begin
  -- Exact contract (case-sensitive, no trim, no regex):
  -- CarrosAutointegral/vehicles/{p_vehicle_id}/{p_asset_id}
  v_expected_public_id :=
    'CarrosAutointegral/vehicles/'
    || p_vehicle_id::text
    || '/'
    || p_asset_id::text;

  if p_public_id is null or p_public_id <> v_expected_public_id then
    raise exception
      'public_id inválido: debe ser exactamente CarrosAutointegral/vehicles/{vehicle_id}/{asset_id}';
  end if;

  if exists (
    select 1 from public.media_assets where id = p_asset_id and deleted_at is null
  ) then
    raise exception 'media_asset duplicado';
  end if;

  if exists (
    select 1 from public.media_assets
    where public_id = p_public_id and deleted_at is null
  ) then
    raise exception 'public_id duplicado';
  end if;

  select count(*)::integer
    into v_position
  from public.vehicle_media
  where vehicle_id = p_vehicle_id;

  if v_position >= 30 then
    raise exception 'Máximo 30 fotografías por vehículo';
  end if;

  select exists (
    select 1 from public.vehicle_media
    where vehicle_id = p_vehicle_id and is_cover = true
  ) into v_has_cover;

  v_is_cover := coalesce(p_make_cover, false) or (not v_has_cover and v_position = 0);

  insert into public.media_assets (
    id,
    provider,
    public_id,
    secure_url,
    resource_type,
    version,
    format,
    width,
    height,
    byte_size,
    original_filename,
    mime_type,
    bucket,
    object_path,
    created_by
  ) values (
    p_asset_id,
    'cloudinary',
    p_public_id,
    nullif(trim(p_secure_url), ''),
    coalesce(nullif(trim(p_resource_type), ''), 'image'),
    p_version,
    nullif(trim(p_format), ''),
    p_width,
    p_height,
    p_byte_size,
    left(trim(p_original_filename), 240),
    p_mime_type,
    null,
    null,
    p_actor_id
  );

  insert into public.vehicle_media (
    vehicle_id,
    media_asset_id,
    position,
    is_cover
  ) values (
    p_vehicle_id,
    p_asset_id,
    v_position,
    v_is_cover
  );

  return jsonb_build_object(
    'media_asset_id', p_asset_id,
    'vehicle_id', p_vehicle_id,
    'position', v_position,
    'is_cover', v_is_cover
  );
end;
$$;

comment on function public.register_cloudinary_vehicle_media is
  'Atomically inserts media_assets (cloudinary) + vehicle_media. Rejects public_id that is not exactly CarrosAutointegral/vehicles/{vehicle_id}/{asset_id}. Staff RLS via SECURITY INVOKER.';

grant execute on function public.register_cloudinary_vehicle_media(
  uuid, uuid, uuid, text, text, text, integer, text, integer, integer, integer, text, text, boolean
) to authenticated, service_role;
