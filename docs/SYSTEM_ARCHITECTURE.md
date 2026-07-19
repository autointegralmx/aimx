# System Architecture

**Producto:** Auto Integral  
**Versión del documento:** 1.0.0  
**Estado:** APROBADO  
**Fecha de aprobación:** 2026-07-19  
**Depende de:** `PRODUCT_REQUIREMENTS_DOCUMENT.md` v1.0.0 (APROBADO)  
**Fase del proyecto:** Fase 0 — Arquitectura (documento 2 de 12)  
**Horizonte de diseño:** 10+ años  
**Fuente arquitectónica de verdad:** Sí — este documento

---

## 1. Propósito

Definir la arquitectura de software de Auto Integral con fronteras, stack, flujos y trade-offs cerrados, de modo que `DATABASE_ARCHITECTURE.md` pueda diseñarse sin decisiones técnicas abiertas en proveedores, auth, ORM o storage.

Este documento **no** incluye código, migraciones, tablas finales ni inicialización de proyecto.

---

## 2. Principios arquitectónicos

| Principio | Implicación |
|-----------|-------------|
| Solución correcta > solución rápida | Fronteras reales de dominio; sin atajos que generen deuda |
| Modular monolith real | Dominios con modelos, repos, casos de uso, permisos, tests |
| Una fuente de verdad de esquema | Migraciones SQL de Supabase; tipos generados desde PostgreSQL |
| SEO como pilar | Render y URLs pensados para indexación desde el día 1 |
| Server trust boundary | Mutaciones solo en servidor; Zod en el borde; RBAC + RLS |
| Config over code | WhatsApp, dominio, plantillas y geo en DB; secretos en env |
| Soft history selectivo | Historial y soft-delete donde el negocio lo exige; no indiscriminado |
| i18n-ready | v1 solo `es-MX`; estructura preparada |
| Performance by default | Objetivo de producto Lighthouse ≥ 95 (medición formal en PERFORMANCE_STRATEGY); media optimizada |
| Portabilidad pragmática | Evitar lock-in frágil; no sobrediseñar rutas de escape |
| Menos proveedores | Preferir el stack Supabase + Vercel + Sentry cuando cubra el caso |

---

## 3. Decisiones arquitectónicas definitivas

| ID | Tema | Decisión |
|----|------|---------|
| A1 | Admin | Path `/admin` en v1; arquitectura host-aware para futuro `admin.autointegral.mx` sin implementarlo aún |
| A2 | Base de datos | **Supabase PostgreSQL** (única opción v1) |
| A3 | Acceso a datos | Migraciones SQL + tipos generados + **supabase-js** en servidor vía **repositorios por dominio**; **sin Drizzle** |
| A4 | Auth | **Supabase Auth** + `@supabase/ssr` (solo personal admin); RBAC + RLS; sin Auth.js; sin tokens manuales en localStorage |
| A5 | Media | **Supabase Storage** en v1 + `MediaStorageService` delgado; metadata en PostgreSQL; migrable a R2/S3 después |
| A6 | Observabilidad | **Sentry** + logs estructurados; sin segunda plataforma en v1 |
| A7 | Estilos | **Tailwind CSS v4** como herramienta; Design System (tokens) como fuente de verdad visual |
| — | Estilo sistema | Modular monolith en **una sola app**; sin monorepo prematuro; sin microservicios |
| — | Hosting | **Vercel** en v1; ruta de escape documentada, no implementada |
| — | Package manager | **pnpm** + lockfile |
| — | Dominio canónico de trabajo | `https://autointegral.mx` vía config central (no hardcode en UI/lógica) |

**No quedan decisiones abiertas de proveedores/ORM/auth/storage que bloqueen el diseño de base de datos.**

---

## 4. Stack definitivo v1

### 4.1 Componentes

| Capa | Tecnología | Rol |
|------|------------|-----|
| App | Next.js App Router | Público + `/admin` |
| UI runtime | React | Server Components por defecto |
| Lenguaje | TypeScript strict | Tipado extremo a extremo |
| Datos | Supabase PostgreSQL | Fuente de verdad |
| Migraciones | Supabase CLI + SQL versionado | Esquema + RLS + funciones |
| Cliente datos | `@supabase/supabase-js` (servidor) | Acceso vía repositorios |
| Auth | Supabase Auth | Solo backoffice |
| Storage | Supabase Storage | Binarios; no en Postgres |
| Validación | Zod | Límites de entrada |
| Forms cliente | React Hook Form | Solo interacciones complejas en cliente |
| Estilos | Tailwind CSS v4 + tokens CSS | Implementación del Design System |
| Unit/integration | Vitest | Dominio, repos (mocked/integration), utils |
| Componentes | Testing Library | UI crítica |
| E2E | Playwright | Flujos lead, admin, SEO smoke |
| Errores | Sentry | Server + client + releases |
| Hosting | Vercel | Deploy app |
| Package manager | pnpm | Workspaces no requeridos en v1 |

### 4.2 Política de versiones (arquitectura)

Este documento **no** fija versiones menores exactas. Las cifras exactas se eligen y verifican en el **bootstrap** del repositorio, consultando registros y documentación oficial en esa fecha.

#### Criterios de selección

1. **Línea estable soportada** — nunca canary, beta, RC ni experimental.  
2. **Compatibilidad** — peer dependencies oficiales entre Next.js, React, TypeScript, Supabase SSR, Tailwind v4, Vitest, Testing Library, Playwright y Sentry.  
3. **Soporte de plataforma** — Node LTS activo compatible con Vercel y Next.js al momento del bootstrap.  
4. **Fijación** — versiones exactas instaladas + `pnpm-lock.yaml`; sin rango flotante `latest` en `package.json`.  
5. **Actualización** — parches/menores compatibles no reabren la arquitectura; major o cambio de proveedor/patrón sí requieren ADR si alteran fronteras.

#### Política aprobada por tecnología

| Tecnología | Política aprobada |
|------------|-------------------|
| Node.js | Última línea LTS activa y compatible con Vercel y Next.js al momento del bootstrap |
| pnpm | Última versión estable mayor compatible con Node y CI al momento del bootstrap |
| Next.js | Última versión estable, no canary, compatible con React y Vercel |
| React | Versión estable requerida oficialmente por la versión seleccionada de Next.js |
| TypeScript | Última versión estable compatible con Next.js y herramientas de testing (`strict: true`) |
| Supabase SDK | Última versión estable compatible del cliente oficial (`@supabase/supabase-js`) y paquete SSR (`@supabase/ssr`) |
| Supabase CLI / Postgres | Línea estable del CLI y PostgreSQL gestionado por Supabase al bootstrap |
| Zod / React Hook Form | Últimas estables compatibles con el stack elegido; RHF solo donde haya forms complejas en cliente |
| Tailwind CSS | Última versión estable de la línea **v4** compatible con Next.js |
| Testing | Versiones estables compatibles entre Vitest, Testing Library y Playwright |
| Sentry | Última versión estable compatible con la versión elegida de Next.js (`@sentry/nextjs`) |

#### Referencia de ecosistema (2026-07-19) — no vinculante

Al momento de aprobar este documento, el ecosistema reporta aproximadamente: **Node.js 24 LTS**, **pnpm línea 11**, **Tailwind CSS línea 4.3**. Esto es **orientación**, no pin. El bootstrap realiza la verificación definitiva.

#### Checklist obligatorio en bootstrap futuro

1. Consultar registros y documentación oficial.  
2. Seleccionar versiones estables compatibles.  
3. Instalar versiones exactas.  
4. Registrar la versión exacta de pnpm en `packageManager`.  
5. Registrar Node mediante `.nvmrc`, `.node-version` o campo `engines`.  
6. Generar `pnpm-lock.yaml`.  
7. Ejecutar instalación limpia, typecheck, lint, tests y build.  
8. Documentar las versiones efectivamente instaladas.  
9. Crear un ADR solo si se evita deliberadamente la versión estable más reciente compatible.

**Regla:** cualquier dependencia adicional requiere justificación escrita o ADR (evitar duplicar capacidades ya cubiertas por Supabase / Next / Zod).

### 4.3 Dependencias explícitamente excluidas en v1

| Excluida | Motivo |
|----------|--------|
| Drizzle / Prisma | Duplicarían el esquema frente a migraciones SQL + tipos generados |
| Auth.js / NextAuth / Clerk | Auth unificada en Supabase Auth + RLS |
| Cloudflare R2 / AWS S3 (runtime v1) | Storage unificado en Supabase Storage; interfaz lista para migrar después |
| OpenNext / dual deploy | No en v1; solo documentado como escape |
| CMS SaaS (Sanity, Contentful, etc.) | CMS de bloques propios en PostgreSQL |
| tRPC | Server Actions + casos de uso bastan |
| Redux / Zustand global por defecto | No hasta necesidad real |
| Segunda APM además de Sentry | Complejidad innecesaria |

---

## 5. Vista de contexto (C4 — Nivel 1)

```
┌──────────────────────────────────────────────────────────────┐
│              Visitantes (móvil / desktop)                     │
│              Sitio público SEO (sin cuentas)                  │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTPS
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                 Auto Integral — Next.js (Vercel)              │
│  ┌────────────────────┐     ┌─────────────────────────────┐  │
│  │ Public App         │     │ Backoffice /admin           │  │
│  │ RSC + SEO pages    │     │ Auth required               │  │
│  └─────────┬──────────┘     └──────────────┬──────────────┘  │
│            │     Domain modules + use cases │                 │
│            └────────────────┬───────────────┘                 │
│                             ▼                                  │
│            Repositories (server-only) + Zod borders            │
└─────────────────────────────┬──────────────────────────────────┘
                              │ user session JWT / RPC acotada (service role solo excepción justificada)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                         Supabase                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ PostgreSQL   │  │ Auth         │  │ Storage            │  │
│  │ + RLS + SQL  │  │ (admin only) │  │ (binarios + ACL)   │  │
│  │ migrations   │  │              │  │                    │  │
│  └──────────────┘  └──────────────┘  └────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
        │                                    │
        ▼                                    ▼
┌───────────────┐                  ┌──────────────────┐
│ Sentry        │                  │ WhatsApp (wa.me) │
│ + server logs │                  │ redirect only    │
└───────────────┘                  └──────────────────┘
```

---

## 6. Modular monolith (real)

### 6.1 Una sola aplicación

```
/
├── docs/
├── supabase/                 # migraciones SQL, seeds, config CLI
│   └── migrations/
├── src/
│   ├── app/                  # rutas Next (delgados)
│   ├── modules/              # dominios
│   ├── shared/               # kernel mínimo (ui primitives, lib)
│   └── instrumentation/      # Sentry, etc.
├── public/
├── tests/
├── package.json
├── pnpm-lock.yaml
└── archivos de configuración
```

**Decisión definitiva:** la aplicación Next.js vive en la **raíz** del repositorio.  
**No** crear `apps/web` en v1.  
**No** crear monorepo multi-package en v1.  
**No** crear microservicios.  
**No** crear packages internos prematuros.  

Si en el futuro existe una segunda aplicación real, se evaluará una migración documentada a monorepo (ADR).

### 6.2 Dominios iniciales

| Dominio (carpeta) | Unidad / responsabilidad |
|-------------------|--------------------------|
| `inventory` | Inventario de vehículos propios |
| `opportunities` | Oportunidades editoriales semanales |
| `automotive-services` | Centro Automotriz |
| `automotive-keys` | Llaves Automotrices (identidad visual propia) |
| `leads` | Ingesta, estados, atribución, idempotencia |
| `content` | CMS de bloques tipados (páginas institucionales) |
| `media` | Metadata + `MediaStorageService` |
| `settings` | Configuración de sitio (no secretos) |
| `admin` | Usuarios admin, roles, sesión bridge, panel shell |
| `audit` | Bitácora de acciones sensibles |

### 6.3 Contenido obligatorio de cada dominio

Cada dominio define, de forma explícita:

1. **Modelos** (tipos de dominio; no filas crudas de UI)  
2. **Validaciones** (Zod / reglas de estado)  
3. **Repositorios** (pequeños, explícitos; supabase-js solo aquí)  
4. **Servicios / casos de uso** (lógica de negocio)  
5. **Permisos** (qué roles pueden qué; chequeos en use case)  
6. **Contratos** (`index` público del módulo)  
7. **Componentes propios** solo cuando el dominio lo necesite  
8. **Pruebas** (unit del dominio + critical paths)

### 6.4 Reglas de dependencia

```
app/ (pages, layouts, actions, route handlers, middleware)
    → use cases / services (dominio)
        → repositories (dominio)
            → supabase client (server)

Prohibido:
  React components → supabase / nombres de tablas
  Server Actions → SQL o reglas de negocio largas (solo validar, autorizar, delegar)
  Route Handlers → lógica de negocio (igual: borde → use case)
  middleware → lógica de negocio (solo gate/redirects)
  inventory → internals de opportunities (y viceversa)
  dependencias circulares entre módulos
```

**Comunicación entre módulos:** solo vía contratos públicos (funciones/tipos exportados en el `index` del dominio).  
**Shared kernel permitido:** primitivas UI del design system, utilidades puras, tipos compartidos mínimos, cliente Supabase server factory, helpers SEO genéricos.

### 6.5 Nombres de dominio vs producto

| Producto | Módulo |
|----------|--------|
| Inventario | `inventory` |
| Oportunidades | `opportunities` |
| Centro Automotriz | `automotive-services` |
| Llaves Automotrices | `automotive-keys` |

---

## 7. Datos: Supabase PostgreSQL como fuente de verdad

### 7.1 Modelo operativo

1. El esquema vive en **migraciones SQL versionadas** (`supabase/migrations`).  
2. **RLS** se define en SQL junto al esquema.  
3. Funciones SQL / **RPC** solo cuando haya necesidad real (atomicidad, reglas difíciles de expresar seguro en el cliente de servidor, o performance justificada).  
4. **Tipos TypeScript generados** desde el esquema (`supabase gen types`).  
5. Backups administrados por Supabase; entornos **development / preview / production** separados.  
6. La aplicación **no** mantiene un segundo esquema ORM.

### 7.2 Acceso: repositorios por dominio (sin Drizzle)

**Por qué se elimina Drizzle**

Mantener Drizzle + migraciones Supabase + RLS + tipos generados crea **dos fuentes de verdad** del esquema y riesgo de divergencia. No hay razón técnica crítica que justifique esa duplicación en este producto.

**Patrón aprobado**

- `supabase-js` **solo en servidor**, dentro de repositorios.  
- Repositorios **explícitos y pequeños** por dominio (`VehicleRepository`, `LeadRepository`, …).  
- **No** “generic repository” universal.  
- Componentes **no** conocen nombres de tablas.  
- Operaciones complejas/atómicas → RPC SQL justificada + llamada desde el repositorio/use case.

**Clientes servidor (concepto)**

| Cliente | Uso |
|---------|-----|
| Usuario autenticado (sesión Supabase SSR) | Operaciones admin respetando RLS del rol |
| Anónimo / borde público → RPC acotada | Preferido para inserción pública de leads |
| Service role (solo servidor, nunca browser) | **Excepción**: únicamente si una RPC no cubre justificadamente el caso; nunca por defecto |

### 7.2.1 Preferencia para inserción pública de leads

Detalle de SQL/políticas → `DATABASE_ARCHITECTURE.md` y `SECURITY.md`. Preferencia arquitectónica **cerrada**:

1. **Preferir** una función **RPC pública, estrecha y auditada**, con permisos mínimos (p. ej. `SECURITY DEFINER` acotado a insertar lead + validaciones).  
2. Usar **service role** únicamente si la RPC no cubre justificadamente el caso.  
3. El service role **nunca** debe estar disponible en cliente, Client Components ni bundles públicos.  
4. **Ningún** repositorio general debe recibir service role por defecto.  
5. La creación de leads debe tener un **único punto de entrada controlado** (un use case / un borde).  
6. Rate limiting e idempotencia **no** deben depender solo de la interfaz (también en servidor / DB según diseño).

El service role no debe convertirse en bypass habitual.

### 7.3 Entornos de datos

| Entorno | Proyecto Supabase | App |
|---------|-------------------|-----|
| local | CLI local / proyecto dev | `localhost` |
| preview | proyecto preview (o branching si se adopta) | Vercel Preview |
| production | proyecto production | `https://autointegral.mx` |

Secretos distintos por entorno. Nunca compartir service role de production con preview.

---

## 8. Autenticación y autorización

### 8.1 Flujo de autenticación (backoffice)

```
Admin user
   │
   ▼
/admin/login  (UI)
   │  email + password (v1)
   ▼
Supabase Auth (signIn)
   │  sesión administrada mediante el mecanismo oficial de cookies
   │  de Supabase SSR para Next.js (@supabase/ssr), con atributos
   │  Secure, SameSite y alcance apropiado según las recomendaciones
   │  vigentes del SDK
   ▼
Middleware: ¿ruta /admin/** y sesión válida?  (gate grueso; NO única capa)
   │ no → redirect /admin/login
   │ sí → continuar
   ▼
Layout/Admin shell: el servidor valida el usuario con Supabase; carga perfil + rol
   ▼
Server Action / Route Handler / use case:
   1) validar sesión otra vez con Supabase
   2) validar permiso/rol otra vez
   3) delegar a use case
   4) repositorio opera con cliente de usuario (RLS)
   ▼
PostgreSQL RLS: defensa en profundidad
```

**Sesión — reglas:**

- Se utiliza `@supabase/ssr` según la guía oficial para Next.js App Router.  
- **No** habrá tokens en `localStorage` administrados manualmente.  
- No se imponen atributos de cookie de forma improvisada que contradigan el SDK (p. ej. forzar `httpOnly` manualmente si eso rompe el flujo oficial de renovación).  
- El servidor valida el usuario con Supabase en capas de confianza.  
- Middleware **no** es la única capa de seguridad.  
- Server Actions, Route Handlers y casos de uso vuelven a validar sesión y permisos.  
- RLS sigue siendo defensa en profundidad.

**Recuperación de contraseña:** flujo Supabase Auth (email) con páginas `/admin/…` propias.  
**Revocación de sesión:** sign-out + invalidación según Auth; posibilidad de desactivar usuario.  
**Sin** cuentas de clientes públicos en v1.

### 8.2 RBAC + RLS (defensa en capas)

| Capa | Responsabilidad |
|------|-----------------|
| Middleware | Gate grueso de sesión en `/admin` |
| Server Action / Route Handler | Authn + Authz antes de delegar |
| Use case | Reglas de negocio + permisos de dominio |
| RLS | Impide lecturas/escrituras indebidas aun si hay bug en app |

**Nunca confiar solo en middleware.**

Roles iniciales (detalle fino en Security/Backoffice docs): `admin`, `editor`, `sales`, `viewer`.

### 8.3 Auditoría de acciones sensibles

El dominio `audit` registra eventos como: login fallido relevante, cambios de settings, publicación de entidades, cambios de rol, borrados lógicos, acceso a datos sensibles de leads, etc. (catálogo cerrado en `SECURITY.md` / `BACKOFFICE_ARCHITECTURE.md`).

---

## 9. Next.js — responsabilidades precisas

| Pieza | Debe | No debe |
|-------|------|---------|
| Server Components | Componer UI, leer vía use cases/repos server | Contener reglas de negocio complejas |
| Client Components | Interacción (forms, galería, menú) | Hablar a Supabase o conocer tablas |
| Server Actions | Validar (Zod), autorizar, delegar a use case, revalidate | Implementar la lógica de dominio |
| Route Handlers | Endpoints públicos/integraciones; mismo patrón borde → use case | Lógica de negocio larga |
| Middleware | Sesión, redirects, headers básicos | Negocio, queries, permisos finos |
| Repositories | Único lugar de supabase-js / RPC | Ser llamados desde el browser |

**Rendering**

| Área | Estrategia |
|------|------------|
| Público SEO | SSR/ISR + revalidación on-demand tras publicar |
| `/admin` | Dinámico, no cache público, protegido |

**Caché:** tras mutaciones exitosas, invalidar paths/tags correspondientes desde el use case o el borde que lo invoca (de forma explícita y centralizable).

---

## 10. Lead-first → WhatsApp

### 10.1 Flujo feliz

```
Usuario pulsa CTA
        │
        ▼
Cliente envía payload tipado (sin URL de redirect arbitraria)
        │
        ▼
Route Handler o Server Action (borde)
  - rate limit
  - Zod validate
  - normalizar teléfono
        │
        ▼
CreateLead use case (dominio leads)
  - clave de idempotencia
  - origen, unidad, página, entidad, UTM, dispositivo
  - persistir lead (estado inicial)
  - resolver WhatsApp desde settings (por unidad)
  - generar mensaje desde plantilla controlada
  - construir URL allowlisted: https://wa.me/{digits}?text=...
        │
        ▼
Respuesta { ok: true, whatsappUrl, leadPublicRef? }
        │
        ▼
Navegador abre WhatsApp (solo tras ok)
```

### 10.2 Requisitos de seguridad y calidad

- Idempotencia (evitar dobles por reintento/doble-click).  
- Rate limiting por IP + señal de dispositivo/form.  
- Normalización de teléfono (formato MX).  
- **Prevención de open redirects:** el cliente **nunca** envía la URL final; solo el servidor genera `wa.me` con dígitos desde Settings.  
- Plantillas de mensaje versionadas en Settings/content controlado.  
- Captura UTM si existe; página origen; entidad relacionada.  
- Independiente de scripts de analytics (no bloquear por tags).  
- No abrir WhatsApp si el servidor no confirma éxito.

### 10.3 Si falla la creación del lead

Experiencia obligatoria (no silencio):

1. El usuario ve un **estado de error claro** en UI (“No pudimos registrar tu solicitud”).  
2. Se ofrece **reintento**.  
3. Se muestra un **canal de respaldo** (teléfono general y/o WhatsApp general desde Settings) como texto/enlace **estático allowlisted** generado también en servidor en la página (no inventado por el cliente).  
4. El error se registra en Sentry **sin** PII completa (ver §14).  
5. Si el fallo es de validación, mensajes de campo específicos; si es de sistema, mensaje genérico + respaldo.

**Regla:** mejor un lead duplicado controlado por idempotencia que perder la solicitud sin feedback.

---

## 11. Media y Storage

### 11.1 Flujo de archivos

```
Admin autenticado
    │
    ▼
Upload UI (client) → Route Handler / Action (borde)
    │  authz + MIME allowlist + size limit
    ▼
Media use case
    │
    ├─► MediaStorageService.generatePath(...)
    ├─► MediaStorageService.upload(bucket, path, bytes)
    ├─► persist metadata en PostgreSQL (dominio media)
    └─► vincular a entidad (inventory/opportunities/…) vía contrato
```

Lectura pública: URLs públicas del bucket público o URLs firmadas para privados vía `MediaStorageService.getUrl` / `signUrl`.

### 11.2 `MediaStorageService` (delgado)

Responsabilidades:

- generar rutas  
- subir  
- eliminar (o soft-delete storage según política)  
- obtener URL  
- firmar URL si es privada  
- no conocer reglas de inventario/oportunidades  

Implementación v1: adaptador **Supabase Storage**.  
Contrato estable: permite sustituir por R2/S3 después **sin** reescribir dominios de negocio.

### 11.3 Metadata en PostgreSQL (independiente del proveedor)

Campos mínimos de asset:

- `id`  
- `bucket`  
- `object_path`  
- `original_filename`  
- `mime_type`  
- `byte_size`  
- `width` / `height`  
- `checksum` (cuando aplique)  
- `alt_text`  
- `position` (en vínculos o en join)  
- `created_at` / `created_by`  
- `deleted_at`  

**Prohibido:** almacenar binarios en PostgreSQL.

Transformación AVIF/WebP y `srcset`: estrategia detallada en `PERFORMANCE_STRATEGY.md` (puede usar loader de Next + URLs de Storage; sin introducir R2 en v1).

---

## 12. CMS de bloques tipados

- Almacenado en PostgreSQL (dominio `content`).  
- Sin page builder libre; sin CMS SaaS en v1.  
- Cada tipo de bloque: schema, validación Zod, **versión**, renderer conocido, campos permitidos, límites, permisos, draft/published cuando aplique.  
- No JSX, no HTML arbitrario, no código ejecutable.  
- Rich text (si existe): sanitizado + allowlist de elementos.  
- El CMS **no** puede romper el Design System (renderers solo usan componentes del sistema).

Catálogo de bloques se cierra en docs de diseño/contenido; la arquitectura solo exige el marco anterior.

---

## 13. Configuración administrable

Dominio `settings` (DB), con validación Zod, auditoría y defaults seguros.

**Incluye como mínimo:**

- nombre público  
- dominio canónico  
- teléfono general  
- WhatsApp por unidad de negocio  
- zona primaria (CDMX / AM)  
- horarios  
- datos de contacto  
- redes sociales  
- SEO base  
- datos legales  
- plantillas de WhatsApp  

**No incluye secretos** (service role, Sentry DSN privados de servidor, etc. → env).

Resolución de origen canónico:

```
env (SITE_URL por entorno) + settings.canonical_domain
→ helper central getSiteOrigin()
→ usado en metadata, sitemap, canonical, OG
```

Trabajo: `https://autointegral.mx`. Nunca hardcodear en componentes.

Variables de entorno diferencian: **local / preview / production**.

---

## 14. Observabilidad (Sentry)

Definido desde arquitectura:

| Tema | Política |
|------|----------|
| Errores servidor | Captura en Node/runtime server |
| Errores cliente | Captura en browser (admin + público con cuidado) |
| Trazas críticas | Lead create, auth admin, uploads, publish |
| Releases | Versionado por deploy/git SHA |
| Source maps | Subidos de forma protegida; no públicos |
| PII scrubbing | No enviar teléfono, mensajes privados, tokens, cookies, Authorization |
| Tags | `module`: inventory, leads, admin, … |
| Entornos | local / preview / production |
| Logs | JSON estructurado en servidor (request id, module, level) |

Sin segunda plataforma de observabilidad en v1.

---

## 15. Seguridad (vista arquitectura)

Detalle fino → `SECURITY.md`. La arquitectura exige:

- RLS en PostgreSQL  
- RBAC en aplicación  
- Autorización repetida en Actions / Handlers / use cases  
- Rate limiting (leads, login, uploads)  
- Validación de archivos: tamaño, MIME allowlist  
- CSRF según mecanismo de mutación (SameSite cookies + origen; patrones Next/Supabase)  
- Content Security Policy y encabezados de seguridad  
- Gestión de secretos en env  
- Protección `/admin`  
- Auditoría (`audit`)  
- Sanitización de rich text  
- Prevención de open redirects  
- Política de datos personales y retención de leads  
- Backups y procedimiento de restauración (Supabase + runbook)

Proveedor/origen de subastas de oportunidades: **solo columnas privadas**; nunca en serializers públicos.

---

## 16. Auditoría y borrado

### 16.1 Timestamps y actores

En entidades operativas relevantes:

- `created_at` / `updated_at`  
- `created_by` / `updated_by` cuando corresponda  
- `deleted_at` **solo** donde se justifique soft-delete  

### 16.2 Soft-delete e historial (selectivo)

| Entidad (clase) | Política |
|-----------------|----------|
| Oportunidades | Sin borrado físico; estados + archivado + historial de transiciones |
| Leads | Sin borrado físico operativo; retención/anonimización según política legal |
| Vehículos / servicios publicados | Unpublish + soft-delete justificado; historial de publicación |
| Media assets | Soft-delete metadata; borrado de objeto storage según política |
| Settings | No delete destructivo; auditoría de cambios |
| Catálogos auxiliares menores | Pueden permitir delete físico si no son auditables de negocio (definir en DB doc) |

**No** aplicar `deleted_at` a todas las tablas por defecto.

Bitácora `audit` para acciones administrativas sensibles.

---

## 17. Estilos

- Tailwind CSS v4 **implementa** el Design System; no lo sustituye.  
- Tokens semánticos + variables CSS; sin colores arbitrarios ni magic numbers repetidos.  
- Mobile first; a11y desde el inicio; `prefers-reduced-motion`; targets táctiles mínimos **44px**.  
- Fuente de verdad visual: `DESIGN_SYSTEM.md` + `COMPONENT_LIBRARY.md`.

---

## 18. Hosting Vercel y ruta de escape (documentada, no implementada)

### 18.1 v1

Un solo camino de deploy: **Vercel**. No OpenNext en paralelo.

### 18.2 Qué es portable

- Código Next.js (App Router)  
- Dominios / casos de uso / repositorios  
- Migraciones SQL y políticas RLS  
- Supabase (DB/Auth/Storage) como backend independiente del host  
- Tailwind tokens, tests, Sentry SDK  

### 18.3 Qué depende de Vercel

- Preview deployments por PR  
- Integración nativa de env  
- Posibles convenciones de ISR/revalidate en su red  
- DX de dashboard  

### 18.4 Cómo migrar (futuro)

1. Mantener app Node-compatible (evitar APIs exclusivas innecesarias).  
2. Apuntar el mismo proyecto Supabase (o réplica).  
3. Adaptar build a OpenNext u otro adapter **solo si se decide salir**.  
4. Recrear env, dominios, headers CSP, crons si los hubiera.  

**No** desarrollar dos rutas de despliegue en v1.

---

## 19. Performance (estructural)

Se distinguen tres niveles (detalle de medición en `PERFORMANCE_STRATEGY.md`):

| Nivel | Definición |
|-------|------------|
| **Objetivo de producto** | Lighthouse Performance ≥ 95 en páginas clave, en condiciones de medición definidas |
| **Presupuesto de rendimiento** | Límites de JS, peso de imágenes, LCP/INP/CLS acordados por tipo de página |
| **Gate reproducible de CI** | Umbrales y procedimiento automatizable (dispositivo, red, muestras, tolerancias) — **no** interpretar cada ejecución manual aislada como fallo de arquitectura |

Formulación: Lighthouse ≥ 95 es **objetivo**, no garantía universal rígida de toda ejecución ad hoc. La estrategia exacta de medición, dispositivo, red, número de muestras y tolerancias se cierra en `PERFORMANCE_STRATEGY.md`.

**Medidas estructurales en esta arquitectura:**

- RSC por defecto; JS de cliente mínimo.  
- Imágenes con tamaños definidos; lazy load; LCP priorizado solo en hero.  
- Revalidación tras publish.  
- Third-parties mínimos; Sentry configurado sin destruir INP.

---

## 20. Testing (vista sistema)

| Capa | Herramienta |
|------|-------------|
| Unit | Vitest (use cases, state machines, plantillas WA, scrubbers) |
| Component | Testing Library |
| Integration | Vitest + Supabase local/test |
| E2E | Playwright (lead flow, admin auth, publish smoke) |

DoD por módulo → `TESTING_STRATEGY.md`.

---

## 21. CI/CD (alto nivel)

```
PR → pnpm install --frozen-lockfile
   → typecheck → lint → vitest → build
   → playwright smoke (main/staging)
   → Vercel preview

main/prod → migrate (Supabase CI) → deploy Vercel
```

Migraciones SQL explícitas; nunca “reset” en production.

---

## 22. i18n y geo

- v1: `es-MX` only.  
- Diccionarios listos para segundo locale.  
- Zona primaria CDMX/AM en settings; modelo de expansión nacional en DB (sin hardcode de una sola ciudad en lógica).

---

## 23. Admin path y futuro host

- v1: `https://autointegral.mx/admin`.  
- Middleware y helpers de origen **host-aware**.  
- Futuro opcional: `admin.autointegral.mx` sin reescribir dominios de negocio.  
- **No** implementar la separación en v1.

---

## 24. Matriz de riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Acoplamiento a Supabase | Medio | Repos + MediaStorageService; SQL estándar; evitar features exóticas innecesarias |
| Service role mal usado | Alto | Preferir RPC pública estrecha para leads; service role solo excepción; nunca en client ni repos generales por defecto |
| RLS incompleto | Alto | Políticas en migraciones; tests de permiso; defense in depth en use cases |
| Divergencia tipos generados | Medio | CI: gen types + typecheck en cada migración |
| Pérdida de leads por error UX | Alto | Flujo de error explícito + canal de respaldo (§10.3) |
| Vendor Vercel | Bajo–Medio | Escape documentado; no dual-run |
| Storage límites / transform | Medio | Metadata desacoplada; migración futura a R2/S3 vía interfaz |
| PII en Sentry | Alto | Scrubbing obligatorio (§14) |
| Open redirect a WhatsApp | Alto | URL generada solo en servidor desde Settings |
| Complejidad modular “de nombre” | Medio | Contratos + reviews; tests por dominio; prohibición de imports internos |

---

## 25. Trade-offs aceptados

| Elegimos | Aceptamos |
|----------|-----------|
| Supabase unificado (DB+Auth+Storage) | Acoplamiento moderado a un vendor de backend; mitigado con repos/interfaces delgadas |
| SQL migrations como única fuente de esquema | Más disciplina SQL; menos magia ORM |
| supabase-js + repos | Menos abstracción tipo ORM; más SQL/RPC consciente |
| Sin Drizzle | No hay query builder TS de primera clase; se compensa con tipos generados y repos claros |
| Supabase Auth | Modelo de usuario ligado a Supabase; roles app + RLS a diseñar bien |
| Supabase Storage en v1 | Posible migración de binarios después; metadata ya portable |
| Un solo deploy Vercel | Escape solo documentado |
| Modular monolith single-app | Extracción a packages/servicios solo cuando el dolor sea real |
| CMS propio de bloques | Hay que construir admin de contenido; a cambio control total |
| Preferir RPC para leads públicos | Service role solo como excepción justificada; no bypass habitual |
| App en raíz (sin `apps/web`) | Migración a monorepo solo si aparece una segunda app real |

---

## 26. Diagramas de flujo clave

### 26.1 Autenticación admin

Ver §8.1.

### 26.2 Lead → WhatsApp

Ver §10.1 y §10.3.

### 26.3 Archivos

Ver §11.1.

### 26.4 Publicación (patrón)

```
Editor en /admin
  → Action (authz)
  → PublishEntity use case (reglas de estado)
  → repository update + audit log
  → revalidate paths/tags SEO
  → entidad visible / indexable según política
```

---

## 27. Mapa a próximos documentos

| Documento | Entrada desde esta arquitectura |
|-----------|----------------------------------|
| `DATABASE_ARCHITECTURE.md` | Tablas, RLS, RPC leads, states, soft-delete selectivo, CMS JSON, media metadata |
| `DESIGN_SYSTEM.md` | Tokens que Tailwind implementa |
| `BACKOFFICE_ARCHITECTURE.md` | UX `/admin`, roles finos |
| `SECURITY.md` | RLS matrices, headers, retención, scrubbing |
| `SEO_STRATEGY.md` | URLs, index rules por estado |
| `PERFORMANCE_STRATEGY.md` | Imágenes desde Storage, CWV |
| `TESTING_STRATEGY.md` | Pirámide y gates |
| `DEVELOPMENT_ROADMAP.md` | Orden por dominios |

---

## 28. Checklist de consistencia interna (v1.0.0)

- [x] Sin “Neon o Supabase”  
- [x] Sin Auth.js  
- [x] Sin R2 como dependencia v1  
- [x] Sin Drizzle  
- [x] Sin versiones menores inventadas en arquitectura  
- [x] Política de versiones + bootstrap checklist  
- [x] App en raíz; sin `apps/web` / sin alternativa abierta  
- [x] Sesión vía `@supabase/ssr` (formulación oficial; sin imponer httpOnly improvisado)  
- [x] Preferencia RPC para leads públicos; service role como excepción  
- [x] Lighthouse como objetivo medible (no garantía ad hoc)  
- [x] Diagramas actualizados a Supabase  
- [x] Matriz de riesgos actualizada  
- [x] Trade-offs actualizados  
- [x] Auth + RLS + RBAC alineados  
- [x] Acceso a datos por repos de dominio  
- [x] Media vía Storage + interfaz delgada  
- [x] Lead-first con UX de error  
- [x] Sin decisiones abiertas de stack que bloqueen DB  

---

## 29. Historial de cambios

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 0.1.0 | 2026-07-19 | Borrador inicial (Drizzle/Auth.js/R2/Neon opcionales) |
| 0.2.0 | 2026-07-19 | Stack definitivo Supabase; repos SQL; eliminación Drizzle/Auth.js/R2 v1 |
| 1.0.0 | 2026-07-19 | Aprobado: política de versiones, SSR cookies, RPC leads, app en raíz, performance, control de cambios |

---

## 30. Aprobación

| Rol | Nombre | Fecha | OK |
|-----|--------|-------|----|
| Product Owner | — | 2026-07-19 | APROBADO CON CAMBIOS MENORES (incorporados) |
| Ingeniería | — | 2026-07-19 | APROBADO |

**Estado del documento:** `APROBADO` — versión **1.0.0** cerrada.

**Confirmación:** SYSTEM_ARCHITECTURE.md queda cerrado en versión 1.0.0 y aprobado como fuente arquitectónica de verdad de Auto Integral.

El siguiente documento de Fase 0, tras confirmación del stakeholder, es `DATABASE_ARCHITECTURE.md`.

---

## 31. Control de cambios arquitectónicos

Reglas:

- `SYSTEM_ARCHITECTURE.md` es la **fuente arquitectónica de verdad**.  
- `DATABASE_ARCHITECTURE.md` debe implementar estas fronteras.  
- No puede introducir otro ORM, proveedor de autenticación o storage sin **ADR aprobado**.  
- No puede modificar reglas funcionales del PRD.  
- Todo cambio estructural futuro requiere motivo, impacto, alternativas, riesgos y decisión.  
- Una actualización de dependencia **compatible** no requiere reabrir la arquitectura.  
- Un cambio de proveedor, patrón de datos o frontera de dominio **sí** requiere ADR.
`)