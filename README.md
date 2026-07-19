# Auto Integral

Plataforma premium de soluciones automotrices.

## Stack (corte 1)

- Next.js App Router + TypeScript strict
- Tailwind CSS v4 (tokens propios)
- Supabase (PostgreSQL, Auth, Storage)
- pnpm

## Desarrollo

Requisitos: Node ≥ 22, pnpm 11.15.0, Docker Desktop (para Supabase local).

```bash
pnpm install
cp .env.example .env.local
# Arrancar Docker, luego:
pnpm supabase:start
# Pegar URL y anon key en .env.local
pnpm db:types
pnpm dev
```

Scripts: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`

Documentación: `docs/`
