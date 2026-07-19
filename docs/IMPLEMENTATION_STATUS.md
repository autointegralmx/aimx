# Implementation Status

**Última actualización:** 2026-07-19

## Fase 2 (en curso) — vehículos V1 dominio + gate

- [x] Decisiones A1 / oportunidades-on-vehicles documentadas
- [x] Migración incremental `20260719220000_vehicles_v1_extensions.sql`
- [x] Schemas Zod + reglas de publicación
- [x] Gate admin (sesión + admin_profiles activo)
- [x] Pruebas unitarias de gate y reglas
- [ ] Validar migración/RLS/Storage con Docker + `supabase start`
- [ ] Formulario admin / upload / CRUD real
- [ ] Conexión pública Home / ficha

## Público (previo)

- [x] CTA WhatsApp directo
- [x] Home reordenada / servicios unificados

## Bloqueador

Docker Desktop no instalado → no declarar migración/RLS/CRUD como validados en runtime.
