# Implementation Status

**Última actualización:** 2026-07-19

## Fase 4 — alta, edición, imágenes y publicación

- [x] Crear borrador (`/admin/vehiculos/nuevo`) → redirige a edición
- [x] Formulario completo `/admin/vehiculos/[id]/editar` (9 secciones en acordeón)
- [x] Galería: upload múltiple, orden, portada, eliminar (máx. 30, 10 MB, JPEG/PNG/WebP)
- [x] Storage path `vehicles/{vehicle_id}/{uuid}.{ext}` vía `media_assets` + `vehicle_media` + bucket `vehicle-images`
- [x] Publicar / despublicar con checklist de requisitos
- [x] Checklist / Publicar se actualizan tras upload sin reload manual
- [x] Vista previa protegida `/admin/vehiculos/[id]/preview`
- [x] Detalle admin `/admin/vehiculos/[id]`
- [x] Conexión pública: Home, `/vehiculos`, categorías, `/oportunidades`, ficha
- [x] WhatsApp contextual en ficha pública
- [x] Cierre técnico + prep remoto: `docs/PHASE4_CLOSURE.md`, `docs/SUPABASE-REMOTE-SETUP.md`, `docs/LOCAL-DEVELOPMENT.md`
- [x] Validación: lint, typecheck, 75 tests, build, `db reset` local
- [x] Supabase remoto conectado (`bxhfwnmebjfpunesukhx`): migraciones aplicadas, sin seed
- [x] Primer admin remoto (Auth user + `admin_profiles`) — ver `docs/SUPABASE-REMOTE-SETUP.md`
- [ ] Pulir UX drag-and-drop táctil / teclado avanzado (hay ↑↓ + drag básico + Guardar orden)
- [ ] Autosave (omitido a propósito por complejidad)

## Fase 3 — listado admin + data layer

- [x] Repositorio / casos de uso / server actions de ciclo de vida
- [x] Listado `/admin/vehiculos` con filtros URL y paginación
- [x] Seed local + grants API (`20260719230000_api_role_grants.sql`)

## Seed local

```bash
npx supabase@latest db reset
```

- `admin@autointegral.local` / `AdminLocal123!`
- `editor@autointegral.local` / `EditorLocal123!`

## Capturas

- Fase 3: `docs/visual-review/admin-vehiculos/`
- Fase 4: `docs/visual-review/admin-phase4/` (01–21)
- Cierre Fase 4: `docs/visual-review/phase4-closure/` (01–13) + `docs/PHASE4_CLOSURE.md`
