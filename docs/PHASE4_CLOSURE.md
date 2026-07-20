# Cierre Fase 4 — preparación Supabase remoto

**Fecha:** 2026-07-19  
**Alcance:** cierre técnico (sin features nuevas). Sin commit. Sin deploy.

## 1. Corrección: refresh tras subir imágenes

### Problema

El checklist de publicación y el botón **Publicar** dependían del prop `images` del servidor. La galería mantenía estado local; tras un upload exitoso el conteo del checklist no se actualizaba hasta `reload` / `router.refresh` completo sin sincronizar estado.

### Solución

1. Estado de medios elevado en `VehicleForm` (`mediaItems` + sync cuando cambia la firma del servidor).
2. `VehicleImageGallery` controlado: `images` + `onImagesChange`.
3. Tras upload / portada / borrar / reordenar: actualización optimista segura + `router.refresh()`.
4. `revalidateVehicleSurfaces` también revalida `/admin/vehiculos/[id]`, `/editar` y `/preview` cuando hay `vehicleId`.

Archivos: `vehicle-form.tsx`, `vehicle-image-gallery.tsx`, `revalidate-vehicle-paths.ts`, `vehicle-actions.ts`.

### Prueba

`tests/unit/inventory-media-checklist.test.tsx` — sin imágenes Publicar deshabilitado; tras upload mock (portada) checklist y Publicar se habilitan sin reload manual.

---

## 2. Servidor local y puertos

Documentado en `docs/LOCAL-DEVELOPMENT.md` → sección **Local server and port troubleshooting**.

| Uso | Comando |
|-----|---------|
| Dev | `pnpm dev` → `:3000` |
| Build | `pnpm build` |
| Start (capturas) | `next start -p 3014` (un solo proceso) |
| Puerto ocupado | `lsof -i :PORT` → confirmar PID del repo → `kill PID` |

No lanzar varios `next start` en background sin comprobar el puerto. No matar procesos ajenos.

---

## 3. Flujo E2E local (Supabase local)

Vehículo de prueba: Nissan Sentra 2018 · slug `nissan-sentra-94663-2018` · id `78828376-e60e-41d7-a5fc-0632df78b091` (antes del `db reset` final de evidencia).

| Paso | Resultado |
|------|-----------|
| 1. Login admin | OK |
| 2. Crear borrador | OK |
| 3. Completar datos | OK |
| 4. Subir ≥5 imágenes | OK (5) |
| 5. Portada | OK (primera / seleccionada) |
| 6. Reordenar | OK |
| 7. Guardar | OK |
| 8. Preview | OK |
| 9. Publicar | OK — **Publicar habilitado sin reload** tras upload |
| 10a. Home | **N/A esperado** — Home muestra destacados/oportunidades, no todo el inventario publicado (este vehículo no era featured) |
| 10b. `/vehiculos` | OK |
| 10c. Categoría (accidentados) | OK |
| 10d. `/oportunidades` | OK (listado; vehículo de prueba no era oportunidad) |
| 10e. Ficha pública | OK (contenido + WhatsApp; aserción automatizada inicial flaky) |
| 11. WhatsApp contextual | OK (`wa.me` con texto del vehículo) |
| 12. Reservado | OK (`Marcar como reservado`) |
| 13. Volver disponible | OK |
| 14. Vendido | OK (`Marcar vendido` en confirmación) → `sold` + `is_published=false` |
| 15. Fuera de vistas públicas | OK — ficha → **404** |
| 16. Duplicar | OK → id `1a4f0050-0513-405d-9a01-6bc0e4a1d470` |
| 17. Duplicado = borrador sin imágenes | OK (`draft`, 0 imágenes) |

Capturas: `docs/visual-review/phase4-closure/01` … `13`.

---

## 4. Matriz Storage

| Caso | Resultado |
|------|-----------|
| Sin archivos huérfanos (`media_assets` sin `vehicle_media`) | OK — 0 |
| Solo una portada por vehículo | OK — 0 vehículos con >1 cover |
| Eliminar imagen borra relación + objeto | OK (código + uso en Fase 4; constraints/cascade) |
| Eliminar portada reasigna otra | OK (lógica de dominio / acciones) |
| Publicado sin imágenes | Bloqueado por checklist + reglas de publicación |
| Máximo 30 imágenes | OK (cliente + `media-use-cases` + tests) |
| MIME inválido | Rechazado (cliente/servidor); Storage anon `text/plain` → 415 |
| > 10 MB | Rechazado (`MAX_VEHICLE_IMAGE_BYTES`) |
| No staff no sube | Server actions `requireStaffProfile` / `assertStaffCanManageVehicles` |
| Público no sube | Anon write vehículos → 401; Storage JPEG anon → 403 RLS |

Bucket: `vehicle-images`. Path: `vehicles/{vehicle_id}/{uuid}.{ext}`.

---

## 5. Matriz de seguridad

| Caso | Resultado |
|------|-----------|
| Público no escribe | OK — POST `vehicles` anon → 401 |
| Auth sin `admin_profiles` no entra | OK — gate `requireStaffProfile` + RLS `is_staff()` |
| Perfil inactivo no entra | OK — `is_active` requerido |
| Editor activo administra vehículos | OK |
| Admin activo administra vehículos | OK |
| Columnas privadas no en público | OK — `vehicles_public` sin `vin` / `internal_price` / `private_notes` / etc. (select → 400) |
| Service role no en cliente | OK — solo `SUPABASE_SERVICE_ROLE_KEY` (sin `NEXT_PUBLIC_`); no uso en `src/` cliente |
| Secrets sin `NEXT_PUBLIC_` | OK — `.env.example` |
| Server actions validan staff | OK |
| RLS autoridad final | OK — grants + policies; trigger no auto-crea staff salvo `provision_staff=true` |

---

## 6. Auditoría de migraciones

Orden (apto para `db push` en proyecto vacío):

1. `20260719190000_initial_vertical_cut.sql`
2. `20260719220000_vehicles_v1_extensions.sql`
3. `20260719230000_api_role_grants.sql`

| Chequeo | Estado |
|---------|--------|
| Orden correcto | OK |
| Sin referencias locales hardcodeadas | OK |
| Sin credenciales / emails demo / passwords | OK (solo en `seed.sql`) |
| Bucket `vehicle-images` | OK |
| Grants API | OK (migración 3) |
| RLS | OK |
| Funciones con `search_path` | OK |
| Vista sin columnas privadas | OK |
| Triggers | OK (incl. publicación / staff condicional) |
| DROP destructivo innecesario | Aceptable: `drop view if exists vehicles_public` al recrear vista en v1 extensions |
| `seed.sql` en producción | **No** — solo `db reset` local |

Cambio relevante pre-remoto (aún sin remoto): trigger de signup **no** provisiona staff por defecto (evita que cualquier signup sea editor). Seed local inserta `admin_profiles` explícitamente.

---

## 7. Documentos

- `docs/SUPABASE-REMOTE-SETUP.md` — procedimiento remoto completo + primer admin.
- `docs/LOCAL-DEVELOPMENT.md` — comandos + puertos.

### Variables

```env
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=   # solo servidor/ops — NUNCA NEXT_PUBLIC_
```

No agregar `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.

### Primer admin remoto

Ver SQL con placeholders en `docs/SUPABASE-REMOTE-SETUP.md` (`admin_profiles.id` = Auth user UID, no `user_id`).

### Seed

`admin@autointegral.local` / `editor@autointegral.local` y vehículos demo viven **solo** en `supabase/seed.sql`.

---

## 8. Calidad (última corrida)

| Check | Resultado |
|-------|-----------|
| lint | OK (`eslint .`) |
| typecheck | OK (`tsc --noEmit`) |
| tests | OK — **75** passed |
| build | OK (`next build`) |
| `supabase status` | OK (API local `:54321`) |
| `supabase db reset` | OK — 3 migraciones + seed |

---

## 9. Capturas

Directorio: `docs/visual-review/phase4-closure/`

| Archivo | Contenido |
|---------|-----------|
| `01-borrador-nuevo.png` | Borrador |
| `02-upload-imagenes.png` | Upload |
| `03-checklist-sin-reload.png` | Checklist actualizado |
| `04-publicar-habilitado.png` | Publicar habilitado |
| `05-preview.png` | Preview |
| `06-publicado.png` | Publicado (admin) |
| `07-home.png` | Home |
| `08-vehiculos.png` | Listado |
| `09-oportunidades.png` | Oportunidades |
| `10-ficha.png` | Ficha |
| `11-whatsapp.png` | WhatsApp |
| `12-vendido-fuera-publico.png` | 404 tras vendido |
| `13-duplicado-borrador.png` | Duplicado borrador sin fotos |

---

## 10. Pendientes exactos antes de crear Supabase remoto

1. Crear proyecto Supabase (Dashboard) y guardar DB password.
2. Seguir `docs/SUPABASE-REMOTE-SETUP.md` (`login` → `link` → `db push`).
3. Verificar tablas, `vehicles_public`, bucket, RLS.
4. Crear primer usuario Auth + fila `admin_profiles` (SQL placeholder).
5. Configurar `.env.local` / secrets de hosting **sin** service role pública.
6. Smoke: login → borrador → imágenes → publicar → lectura pública.
7. **No** aplicar `seed.sql` en remoto.
8. (Opcional) regenerar `database.types.ts` con `--linked`.

Fuera de alcance de este cierre (no bloquean remoto):

- Autosave
- DnD táctil/teclado avanzado
- Cambios de Home / nuevas líneas de negocio
