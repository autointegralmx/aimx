-- Allow "En subasta" intent on unpublished units (status available/reserved).
-- Public lists still require is_published; this only stops the first Guardar
-- from wiping the checkbox before Publicar.

alter table public.vehicles
  drop constraint if exists vehicles_opportunity_requires_published;

alter table public.vehicles
  drop constraint if exists vehicles_opportunity_requires_listable_channel;

alter table public.vehicles
  add constraint vehicles_opportunity_requires_listable_channel check (
    is_weekly_opportunity = false
    or (
      status in ('available', 'reserved')
      and deleted_at is null
    )
  );

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

  -- Keep auction intent while unpublished so Guardar → Publicar works on first try.
  -- Public queries still require is_published = true.
  if new.is_weekly_opportunity = true then
    if new.status not in ('available', 'reserved')
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
