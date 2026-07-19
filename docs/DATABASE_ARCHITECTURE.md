# Database Architecture — Vertical Cut 1 (+ V1 vehicle extensions)

**Producto:** Auto Integral  
**Versión:** 0.2.0 — EN EVOLUCIÓN  
**Fecha:** 2026-07-19  
**Alcance:** Inventario + Leads + Media + Admin + Settings + flags de Oportunidades sobre `vehicles`  
**Depende de:** `SYSTEM_ARCHITECTURE.md` v1.0.0

---

## 1. Principio

No modela todos los dominios futuros. Ampliaciones llegan con migraciones incrementales.

**Decisiones V1 (aprobadas):**

- Estados **A1**: un solo `status` + `is_published` (sin `internal_status` / `commercial_status`).
- Oportunidades = vehículos con `is_weekly_opportunity` (sin tabla `opportunities`).
- Daños y etiquetas públicas = arrays controlados (`text[]`), no tablas satélite.
- Admin gate: sesión + `admin_profiles` activo con rol `admin|editor`.

---

## 2. Migraciones

| Archivo | Contenido |
|---------|-----------|
| `20260719190000_initial_vertical_cut.sql` | Corte inicial (no modificar) |
| `20260719220000_vehicles_v1_extensions.sql` | Campos V1, constraints, índices, vista pública |

---

## 3. Estados (A1)

`vehicle_status`: `draft` | `available` | `reserved` | `sold` | `archived`

| UX | status | is_published |
|----|--------|--------------|
| Borrador | draft | false |
| Publicado disponible | available | true |
| Reservado | reserved | true |
| Vendido | sold | false |
| Archivado | archived | false |

Reglas (dominio + SQL check/trigger):

- draft / sold / archived → no publicados;
- available / reserved → pueden publicarse;
- sold → `is_weekly_opportunity = false`;
- archived → `is_featured = false` y `is_weekly_opportunity = false`;
- `deleted_at` excluye de vistas normales y limpia flags de promoción.

---

## 4. Oportunidades (sobre vehicles)

Campos:

- `is_weekly_opportunity boolean not null default false`
- `opportunity_deadline timestamptz null`
- `featured_order integer null` (≥ 0)

`is_featured` = destacado general (Home/listados).  
`is_weekly_opportunity` = sección Oportunidades.

Orden público activo:

1. `featured_order` asc nulls last  
2. `opportunity_deadline` asc nulls last  
3. `published_at` desc  
4. `created_at` desc  

Filtro activo: publicada + oportunidad + available|reserved + no borrada + (`opportunity_deadline` null o futura).

---

## 5. Campos V1 en `vehicles` (adicionales)

Identificación: `stock_code` (único si no null).  
Público: `public_title`, `full_description`, `body_type`, `price_label`, `damage_summary`, `condition_notes`, `damage_tags[]`, `public_tags[]`.  
Privado: `provider_reference`, `internal_price` (+ `vin`, `private_notes` existentes).  
SEO ligero: `seo_title`, `seo_description`.  
Precio público sigue en `price_amount` (+ `currency`).

`public_description` se conserva por compatibilidad; la vista pública usa `coalesce(full_description, public_description)`.

---

## 6. Vista `vehicles_public`

Expone solo columnas públicas (incluye oportunidad/tags/daños públicos/SEO).

**Nunca** expone: `vin`, `provider_reference`, `private_notes`, `internal_price`, `stock_code`, `created_by`, `updated_by`.

Código público: leer `vehicles_public` o selects explícitos — **no** `select('*')` sobre `vehicles`.

---

## 7. Media

Sin cambio de arquitectura: `media_assets` + `vehicle_media` + bucket `vehicle-images`.  
Una portada por vehículo (índice único parcial).

---

## 8. Admin auth

- Middleware (`updateSession`): exige env configurado; sesión; perfil activo `admin|editor`.
- Layout `(panel)`: re-valida en servidor.
- Login: tras `signInWithPassword`, verifica perfil; si falla, `signOut` + error.

RLS sigue siendo autoridad final para lecturas/escrituras.

---

## 9. Validación local

Requiere Docker Desktop + `pnpm supabase:start` + `pnpm db:types`.  
Hasta entonces: migración y RLS **escritas pero no verificadas en runtime**.
