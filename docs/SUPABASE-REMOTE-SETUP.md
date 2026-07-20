# Supabase remote setup

Procedimiento para conectar Auto Integral a un proyecto Supabase **nuevo**.  
No incluye claves reales. No aplica `seed.sql` en producción.

## Prerequisites

- Cuenta Supabase
- CLI: `npx supabase@latest`
- Repo local con migraciones en `supabase/migrations/`
- `.env.example` como plantilla

## 1. Crear proyecto

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project**.
2. Elegir organización.
3. Nombre del proyecto (ej. `autointegral-prod`).
4. **Database password**: generar y guardar en un gestor de secretos (no en git).
5. **Region**: la más cercana a usuarios (ej. `South America` / `us-east-1` según disponibilidad).
6. Esperar a que el proyecto esté **Healthy**.

## 2. Obtener credenciales

En **Project Settings → API**:

| Variable | Dónde |
|----------|--------|
| Project URL | → `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | → `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Project Reference | ID corto del proyecto (para `link`) |

En **Project Settings → Database** (solo servidor / ops, nunca al cliente):

| Variable | Uso |
|----------|-----|
| `service_role` key | Solo scripts/admin server-side si se necesita. **Nunca** `NEXT_PUBLIC_…` |

WhatsApp (ya existente):

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Dígitos internacionales, ej. `52155…` |
| `NEXT_PUBLIC_SITE_URL` | Origen canónico del sitio |

## 3. Link y push de migraciones

Desde la raíz del repo:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref PROJECT_REF
npx supabase@latest db push
```

Confirmar que se aplican, en orden:

1. `20260719190000_initial_vertical_cut.sql`
2. `20260719220000_vehicles_v1_extensions.sql`
3. `20260719230000_api_role_grants.sql`

**No** ejecutar `db reset` contra remoto.  
**No** cargar `supabase/seed.sql` en producción.

## 4. Verificaciones post-push

En SQL Editor / Table Editor:

1. Tablas: `admin_profiles`, `vehicles`, `media_assets`, `vehicle_media`, `audit_events`, …
2. Vista `vehicles_public` existe y **no** expone `vin`, `internal_price`, `private_notes`, `provider_reference`, `stock_code`.
3. Bucket Storage `vehicle-images` (público lectura; escritura solo staff vía RLS).
4. RLS habilitado en tablas sensibles.
5. Grants a `anon` / `authenticated` / `service_role` (migración de grants).

## 5. Primer admin (seguro)

El trigger `on_auth_user_created` **no** crea staff automáticamente (salvo metadata `provision_staff=true`).

### Flujo recomendado

1. **Authentication → Users → Add user** (email + password).
2. Copiar el **User UID**.
3. En SQL Editor:

```sql
insert into public.admin_profiles (
  id,
  email,
  full_name,
  role,
  is_active
)
values (
  'REEMPLAZAR_CON_AUTH_USER_ID'::uuid,
  'REEMPLAZAR_CON_EMAIL',
  'Administrador',
  'admin',
  true
);
```

4. Probar login en `/admin/login` con ese usuario.
5. Crear un segundo usuario Auth **sin** fila en `admin_profiles` y confirmar que **no** entra al panel.

Para promover un editor:

```sql
update public.admin_profiles
set role = 'admin', is_active = true
where id = 'REEMPLAZAR_CON_AUTH_USER_ID'::uuid;
```

Para desactivar acceso:

```sql
update public.admin_profiles
set is_active = false
where id = 'REEMPLAZAR_CON_AUTH_USER_ID'::uuid;
```

## 6. Configurar la app

`.env.local` (local contra remoto) o secrets del host:

```env
NEXT_PUBLIC_SITE_URL=https://tu-dominio.example
NEXT_PUBLIC_WHATSAPP_NUMBER=52XXXXXXXXXX
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Solo servidor / ops — NUNCA en el cliente ni con prefijo NEXT_PUBLIC_
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Reiniciar:

```bash
npx --yes pnpm@11.15.0 exec next build
npx --yes pnpm@11.15.0 exec next start
```

## 7. Smoke remoto

1. Login admin OK.
2. Usuario sin `admin_profiles` → rechazado.
3. Crear borrador de vehículo.
4. Subir imágenes (JPEG/PNG/WebP ≤ 10 MB).
5. Publicar.
6. Ver en `/vehiculos` y ficha pública.
7. Confirmar que VIN / notas privadas no aparecen públicamente.

## 8. Seed local vs producción

| Artefacto | Local (`db reset`) | Remoto (`db push`) |
|-----------|--------------------|--------------------|
| Migraciones | Sí | Sí |
| `seed.sql` (admins demo, vehículos demo) | Sí | **No** |
| `admin@autointegral.local` | Solo seed | No |

## 9. Regenerar tipos (opcional)

Tras cambios de schema:

```bash
# Local
npx supabase@latest gen types typescript --local > src/shared/lib/database.types.ts

# Remoto (tras link)
npx supabase@latest gen types typescript --linked > src/shared/lib/database.types.ts
```

## Pendientes antes de ir a remoto

Ver `docs/PHASE4_CLOSURE.md`.
