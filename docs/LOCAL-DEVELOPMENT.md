# Local development

Commands for Auto Integral against **Supabase local**.

## Standard commands

```bash
# Dependencies
npx --yes pnpm@11.15.0 install

# Supabase local (requires Docker)
npx supabase@latest start
npx supabase@latest status
npx supabase@latest db reset   # migrations + seed.sql (local only)

# App
cp .env.example .env.local     # then fill keys from `supabase status`
npx --yes pnpm@11.15.0 exec next dev          # default :3000
npx --yes pnpm@11.15.0 exec next build
npx --yes pnpm@11.15.0 exec next start        # serves .next on :3000

# Quality
npx --yes pnpm@11.15.0 lint
npx --yes pnpm@11.15.0 exec tsc --noEmit
npx --yes pnpm@11.15.0 test
```

Package scripts (same idea): `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm supabase:status`, `pnpm supabase:reset`.

## Capturas / servidor de producción local

Usar **un solo** puerto y un solo proceso:

```bash
npx --yes pnpm@11.15.0 exec next build
npx --yes pnpm@11.15.0 exec next start -p 3014
```

Para desarrollo diario preferir `next dev` en `:3000`.

## Local server and port troubleshooting

### Ver qué proceso usa un puerto

```bash
lsof -i :3000
lsof -i :3014
lsof -i :54321
```

### Reutilizar vs reiniciar

1. Si `curl -sf http://127.0.0.1:PORT/` responde y el build es el esperado → **reutilizar**.
2. Si el puerto está ocupado por un `next` viejo o fallido:
   - Identificar PID con `lsof -i :PORT`.
   - Confirmar que es el proceso de este repo (`ps -p PID -o command=`).
   - Detener solo ese PID: `kill PID` (o `kill -9 PID` si no termina).
3. No matar procesos ajenos (navegadores, otros proyectos).
4. No lanzar varios `next start` en background sin comprobar el puerto.

### Conflictos típicos

| Síntoma | Causa | Acción |
|---------|--------|--------|
| `EADDRINUSE :::3014` | Ya hay un Next escuchando | `lsof -i :3014` → kill del PID correcto |
| `exit_code=1` en un start en background | Puerto ocupado o proceso matado al reiniciar | Arrancar de nuevo **después** de liberar el puerto |
| Login / DB fallan | Supabase local abajo | `npx supabase@latest status` / `start` |

### Seed local (solo desarrollo)

Tras `db reset`, usuarios de prueba:

- `admin@autointegral.local` / `AdminLocal123!`
- `editor@autointegral.local` / `EditorLocal123!`

Estos datos viven **solo** en `supabase/seed.sql`. No se aplican con `db push` a remoto.
