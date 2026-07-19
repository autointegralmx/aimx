# Product Requirements Document (PRD)

**Producto:** Auto Integral  
**Versión del documento:** 1.0.0 — Aprobado con cambios  
**Estado:** APROBADO  
**Fecha de aprobación:** 2026-07-19  
**Audiencia:** Fundadores, Product, Diseño, Ingeniería  
**Fase del proyecto:** Fase 0 — Arquitectura (documento 1 de 12)

---

## 1. Resumen ejecutivo

Auto Integral es una plataforma digital premium de una empresa especializada en **soluciones automotrices integrales**. No es un lote, no es una agencia de marketing, no es un marketplace público y **no es una plataforma de subastas**.

La plataforma concentra tres frentes principales en una sola experiencia de marca:

1. **Vehículos** — accidentados, recuperados y seminuevos, con información clara y contacto directo.
2. **Oportunidades** — selección semanal curada de vehículos disponibles en subastas (origen interno; nunca expuesto al visitante). Flujo: ficha → solicitar información → WhatsApp. Sin pujas públicas ni compra en línea.
3. **Servicios** — únicamente **Centro Automotriz** y **Llaves Automotrices**.

El objetivo del producto no es “vender autos en línea”. El objetivo es **vender confianza** y convertir interés en contacto calificado (principalmente WhatsApp), con trazabilidad completa en un backoffice profesional.

---

## 2. Problema que resolvemos

### 2.1 Problema del cliente

Quien busca un vehículo especial, un servicio de taller confiable o una solución de llaves enfrenta:

- Ofertas opacas o poco profesionales.
- Falta de información clara sobre estado, documentación y proceso.
- Sitios saturados, genéricos o poco creíbles.
- Dificultad para hablar con alguien que realmente resuelva.

### 2.2 Problema del negocio

Sin una plataforma sólida, Auto Integral depende de canales dispersos (mensajes, redes, llamadas) sin:

- Inventario y oportunidades presentados con calidad premium.
- Registro y seguimiento de leads.
- SEO estructural que genere demanda orgánica.
- Identidad digital reconocible y coherente en el tiempo.

### 2.3 Oportunidad

Construir un producto de marca de largo plazo (10+ años) que concentre inventario, oportunidades y servicios, con operación interna profesional y experiencia pública editorial.

---

## 3. Visión de producto

> Cuando alguien vea una captura de pantalla **sin logotipo**, debe poder reconocer que pertenece a Auto Integral.

La plataforma debe transmitir:

| Atributo        | Manifestación en producto                                      |
|-----------------|----------------------------------------------------------------|
| Confianza       | Transparencia de estado, proceso claro, contacto humano        |
| Profesionalismo | Tipografía, espacio, fotografía, copy preciso                  |
| Transparencia   | Datos del vehículo visibles; sin promesas vacías               |
| Experiencia     | Flujo móvil fluido, animaciones sobrias, velocidad percibida   |
| Calidad         | Menos piezas, mejor ejecutadas; cero plantilla genérica        |
| Tecnología      | Performance, SEO, backoffice ágil, seguridad server-side       |

---

## 4. Principios de producto (no negociables)

1. **Confianza antes que conversión agresiva.** No carrito, no checkout, no pujas, no “compra ahora” engañoso.
2. **Una pregunta por pantalla.** Cada vista responde una sola intención clara.
3. **Mobile first.** Diseño y UX nacen en teléfono; desktop es adaptación.
4. **Menos elementos, más calidad.** Evitar sliders genéricos, cards innecesarias y bloques repetitivos.
5. **Identidad propia.** Inspiración (Apple, Porsche, Tesla, Nothing, Singer, BaT, Collecting Cars) sin copia.
6. **SEO desde el día uno.** Parte de la arquitectura, no un add-on.
7. **Seguridad server-side.** Toda escritura validada; nunca confiar en el cliente.
8. **Un componente, muchas variantes.** Configurable por props; cero duplicados.
9. **Solución correcta > solución rápida.** Preferir inversión inicial a deuda técnica.
10. **Fases con gate de aprobación.** No iniciar la siguiente fase sin cerrar la anterior.

---

## 5. Decisiones de producto cerradas (aprobadas 2026-07-19)

### P1 — Lead-first WhatsApp — APROBADO

Todo contacto se registra **primero en el servidor** y **después** se redirige a WhatsApp.

Garantiza: trazabilidad, estadísticas, seguimiento de leads y futuras integraciones CRM.

**Campos mínimos obligatorios de cada Lead:**

| Campo | Descripción |
|-------|-------------|
| origen | Canal/contexto del CTA (ej. detalle vehículo, servicio, home) |
| fecha | Timestamp de creación (servidor) |
| unidad de negocio | Vehículos \| Oportunidades \| Centro Automotriz \| Llaves \| General |
| página origen | URL/path de donde partió la solicitud |
| vehículo o servicio consultado | Referencia a entidad (nullable si contacto general) |
| utm | Parámetros UTM si existen (`utm_source`, `utm_medium`, `utm_campaign`, etc.) |
| dispositivo | Señal de dispositivo/cliente (user-agent / viewport class capturado en servidor) |
| estado del lead | Ciclo de seguimiento operativo |

Flujo: captura → validación server-side → persistencia Lead → deep link WhatsApp prellenado.

### P2 — Llaves Automotrices — APROBADO

- Forman parte de Auto Integral (no marca independiente en v1).
- Identidad visual propia dentro del mismo ecosistema (SEO + especialización).
- La arquitectura debe permitir, en el futuro, escisión a marca independiente **sin reescribir el núcleo**.

### P3 — Oportunidades — APROBADO

Flujo editorial. Estados:

1. Borrador  
2. Programada  
3. Publicada  
4. Reservada  
5. Cerrada  
6. Expirada  
7. Archivada  

**No eliminar publicaciones.** Todo conserva historial (auditoría / soft-archive).

### P4 — Idioma — APROBADO

- v1: únicamente Español (México).
- Arquitectura preparada para i18n futura **sin rediseñar el sistema**.

### P5 — Mercado — APROBADO

- Operación inicial: **Ciudad de México y Área Metropolitana**.
- Plataforma lista para crecimiento **nacional** sin cambios arquitectónicos.

### P6 — Cómo Comprar — APROBADO

Proceso real a representar (sin prometer pasos inexistentes):

1. Encuentra el vehículo.  
2. Solicita información.  
3. Recibe asesoría.  
4. Agenda revisión.  
5. Verifica documentación.  
6. Toma tu decisión.  
7. Entrega del vehículo.  

### P7 — Stack — APROBADO (dirección)

Tecnologías modernas, estables y ampliamente soportadas. Selección final y trade-offs en `SYSTEM_ARCHITECTURE.md`.

### P8 — CMS — APROBADO

- CMS estructurado por **bloques limitados**.
- Sin Page Builder libre.
- Solo contenido controlado.

### P9 — Dominio — PENDIENTE (con default operativo)

- Default actual: `autointegral.mx` (si no está disponible, se evalúan alternativas).
- Arquitectura **agnóstica al dominio**: cambiar dominio no debe requerir cambios estructurales.

### P10 — WhatsApp multi-número — APROBADO

- Diseñado desde el inicio para **múltiples números**.
- v1 probablemente un solo número.
- Configurable por unidad de negocio (Inventario, Oportunidades, Centro, Llaves) **sin modificar código**.

### Principios adicionales confirmados

- Horizonte **10+ años**: nada “solo para v1” que bloquee el futuro.
- Arquitectura **escalable y modular**.
- Cada unidad de negocio puede **evolucionar de forma independiente**.
- **SEO como pilar**, no complemento.
- Backoffice = **herramienta de operación diaria** (rápida, intuitiva, agradable).
- Diseño: identidad propia — minimalista, elegante, tecnológica, editorial — no agencia tradicional.
- **Cero desarrollo** hasta cerrar toda la documentación de Fase 0.

---

## 6. Objetivos de negocio y de producto

### 6.1 Objetivos de negocio

| Objetivo                         | Indicador de éxito (inicial)                          |
|----------------------------------|--------------------------------------------------------|
| Generar leads calificados        | Leads/mes por unidad de negocio                        |
| Posicionar marca premium         | Percepción cualitativa + consistencia visual           |
| Demanda orgánica                 | Tráfico SEO a vehículos, servicios y llaves            |
| Operación interna eficiente      | Tiempo de publicación de vehículo/oportunidad          |
| Conversión a WhatsApp trazable   | % CTAs que generan lead registrado                     |

### 6.2 Objetivos de producto (lanzamiento)

- Experiencia pública premium, mobile-first, Lighthouse ≥ 95 en páginas clave.
- Backoffice usable a diario (no CRUD genérico).
- SEO estructural en todas las entidades indexables.
- Cero flujos de compra/subasta en UI pública.
- Design system y datos congelados post-aprobación de Fase 0–2.

### 6.3 Fuera de alcance (v1 explícito)

- Compra en línea, carrito, checkout, pagos.
- Subastas públicas, pujas, timers de oferta.
- Exposición de proveedor/plataforma de origen de oportunidades.
- App nativa iOS/Android.
- Marketplace de terceros / usuarios vendedores públicos.
- Chat in-app (WhatsApp es el canal humano).
- Multiidioma completo.
- Multi-sede completa (solo preparación de modelo).
- Programa de lealtad / puntos.
- Integración contable o ERP (puede evaluarse post-v1).

---

## 7. Audiencias y personas

### 7.1 Visitante — Comprador de vehículo

- Busca inventario claro o una oportunidad semanal.
- Necesita confianza sobre estado, papeles y proceso.
- Prefiere hablar por WhatsApp antes de desplazarse.

### 7.2 Visitante — Dueño de vehículo (servicios)

- Necesita diagnóstico, mecánica, estética o llaves.
- Busca profesionalismo y claridad de servicios.
- Puede llegar por SEO (“programación de llave [marca]”, “afinación [ciudad]”).

### 7.3 Visitante — Urgencia de llaves

- Llave perdida, no abre, necesita duplicado o smart key.
- Quiere respuesta rápida y servicio a domicilio.
- Menos “editorial”, más claridad + CTA inmediato (sin perder identidad premium).

### 7.4 Operador de backoffice

- Publica inventario y oportunidades.
- Gestiona leads (estados, notas, seguimiento).
- Administra multimedia, SEO y usuarios.
- Trabaja todos los días: la UX del panel es producto, no utilidad secundaria.

### 7.5 Administrador

- Configuración, permisos, usuarios, métricas del dashboard.

---

## 8. Unidades de negocio y requisitos funcionales

### 8.1 Vehículos

**Rutas públicas:** `/vehiculos`, `/vehiculos/accidentados|recuperados|seminuevos`, `/vehiculos/[slug]`  
**Compatibilidad:** `/inventario` → `/vehiculos` (redirección; sin contenido duplicado).

**Pregunta de la pantalla listado:** ¿Qué vehículos están disponibles?  
**Pregunta del detalle:** ¿Por qué vale la pena este vehículo?

#### Categorías

- Accidentados
- Recuperados
- Seminuevos

#### Campos mínimos de un vehículo (requeridos en v1)

| Grupo            | Contenido                                                                 |
|------------------|---------------------------------------------------------------------------|
| Identidad        | Marca, modelo, versión/trim, año, categoría                               |
| Comercial        | Precio (o “Precio a consultar”), estado de publicación, destacado         |
| Descripción      | Resumen editorial, descripción larga                                      |
| Estado           | Estado mecánico, observaciones, historial relevante (sin datos sensibles) |
| Equipamiento     | Lista estructurada                                                        |
| Documentación    | Indicadores de papeles / checklist visible al público (sin docs privados) |
| Media            | Galería ordenada (hero + adicionales)                                     |
| SEO              | Title, description, slug, OG image                                        |
| Contacto         | CTA → flujo de lead + WhatsApp                                            |

#### Requisitos

- Listado filtrable (categoría, marca, año, rango de precio — según datos disponibles).
- Detalle con galería de alta calidad, información completa y CTA de contacto.
- Vehículos no publicados no son indexables ni accesibles por URL pública (o redirigen 404/410 según política SEO).
- Nunca mostrar datos internos de costo, proveedor o notas privadas en el front público.

### 8.2 Oportunidades

**Pregunta:** ¿Qué oportunidades existen esta semana?

#### Reglas de negocio críticas

- No hay compra en línea.
- No hay subastas públicas.
- No hay pujas.
- No hay carrito ni checkout.
- El visitante **solo solicita información** (WhatsApp + lead).
- **Nunca** se muestra la plataforma de subastas ni el proveedor.

#### Requisitos

- Presentación editorial (pocas piezas, alta calidad), no grid de marketplace masivo.
- Contexto temporal: “Selección de esta semana” (o copy aprobado).
- Detalle con información suficiente para decidir contactar; sin revelar origen.
- CTA único de solicitud de información (Lead-first → WhatsApp).
- Ciclo de vida editorial con estados: Borrador, Programada, Publicada, Reservada, Cerrada, Expirada, Archivada.
- **Sin borrado físico** de publicaciones; historial completo conservado.

### 8.3 Centro Automotriz

**Pregunta:** ¿Qué servicios ofrecen?

#### Servicios (catálogo v1)

Diagnóstico con scanner, Mecánica, Suspensión, Frenos, Afinación, Hojalatería y pintura, Estética automotriz, Detallado, Pulido, Lavado de vestiduras.

**Fuera de alcance:** consignación, compra y venta, compra de vehículos, intermediación comercial como servicio independiente.

#### Requisitos

- Página índice del centro + **página individual por servicio** (SEO).
- Contenido: beneficio, para quién es, qué incluye (alto nivel), CTA de contacto.
- Posibilidad de agrupar por familia (mecánica, estética, comercial) sin saturar la UI.
- Lead tipado: servicio de origen.

### 8.4 Llaves Automotrices

**Pregunta:** ¿Qué soluciones ofrecen para mi llave?

#### Servicios (catálogo v1)

Programación de llaves con chip, Llaves inteligentes, Smart Keys, Llaves de proximidad, Duplicados, Controles remotos, Llaves perdidas, Apertura de vehículos, Programación de inmovilizador, Reemplazo de llaves, Servicio a domicilio.

#### Requisitos

- Identidad visual propia dentro del sitio (ver P2).
- Índice + páginas por servicio (SEO).
- CTA prioritario (urgencia) sin romper tono premium.
- Lead tipado: servicio de llaves / urgencia si aplica.

### 8.5 Páginas institucionales y de conversión

| Página        | Pregunta que responde                         |
|---------------|-----------------------------------------------|
| Inicio        | ¿Por qué confiar en Auto Integral?            |
| Cómo Comprar  | ¿Cómo es el proceso para adquirir un vehículo?|

Proceso público (P6): Encuentra el vehículo → Solicita información → Recibe asesoría → Agenda revisión → Verifica documentación → Toma tu decisión → Entrega del vehículo.
| Nosotros      | ¿Quiénes son y por qué existen?               |
| Contacto      | ¿Cómo puedo hablar con ustedes?               |

#### Home — requisitos de experiencia

- Hero cinematográfico (fotografía full-bleed, tipografía fuerte, espacio).
- Sin sliders genéricos.
- Sin estadísticas/promos/chips flotantes saturando el primer viewport.
- Primer viewport: marca + un mensaje + un apoyo corto + CTA(s) + imagen dominante.
- Secciones posteriores: Vehículos, Oportunidades, Servicios (Centro + Llaves), Cómo Comprar, Por qué Auto Integral, Contacto.
- Motion sobrio (2–3 intenciones claras), no ruido.

---

## 9. Navegación principal

Orden fijo del menú público:

1. Inicio  
2. Vehículos (dropdown: Accidentados, Recuperados, Seminuevos)  
3. Oportunidades  
4. Servicios (dropdown/mega: Centro Automotriz, Llaves Automotrices)  
5. Cómo Comprar  
6. Nosotros  
7. Contacto  

**CTA principal del header:** Ver vehículos  

**Notas UX:**

- En mobile: acordeones para Vehículos (3 categorías) y Servicios (2 grupos); sin listar los 19 servicios en el menú.
- No usar “Inventario” como etiqueta visible de navegación.
- Llaves no aparece como ítem de primer nivel; vive bajo Servicios.

---

## 10. Backoffice — requisitos de producto

El panel no es un CRUD genérico. Debe sentirse como un producto interno profesional: rápido, limpio, minimalista, agradable a diario.

### 10.1 Módulos

| Módulo              | Responsabilidad principal                                      |
|---------------------|----------------------------------------------------------------|
| Dashboard           | Resumen operativo: leads nuevos, vehículos, oportunidades      |
| Vehículos           | CRUD editorial + publicación + media + SEO (módulo técnico `inventory` OK) |
| Oportunidades       | Curaduría semanal + estados + publicación                      |
| Centro Automotriz   | Servicios, contenido, SEO, orden                               |
| Llaves              | Servicios de llaves, contenido, SEO, orden                     |
| Leads               | Inbox con estados, notas, asignación, origen                   |
| Multimedia          | Biblioteca de assets, uso, reemplazo, optimización             |
| Configuración       | Datos de negocio, WhatsApp, ubicación, ajustes de sitio        |
| Usuarios            | Cuentas, roles, permisos                                       |
| SEO                 | Vista global / por entidad: titles, indexación, previews       |

### 10.2 Leads

Toda solicitud se registra **antes** de redirigir a WhatsApp:

- Desde vehículos (inventario)
- Desde oportunidades
- Desde servicios del centro
- Desde llaves
- Desde contacto general / cómo comprar (si aplica)

**Campos mínimos (P1):** origen, fecha, unidad de negocio, página origen, vehículo o servicio consultado, UTM (si existe), dispositivo, estado del lead. Más: nombre, teléfono, mensaje, notas internas, responsable (opcional), historial de cambios de estado.

**Estados (propuesta v1):** `new` → `contacted` → `qualified` → `won` | `lost` | `spam`

**WhatsApp (P10):** el número de destino se resuelve por configuración según unidad de negocio (multi-número desde arquitectura; un número en v1 operativo).

### 10.3 Roles (propuesta v1)

| Rol       | Alcance aproximado                                      |
|-----------|---------------------------------------------------------|
| Admin     | Todo                                                    |
| Editor    | Contenido, inventario, oportunidades, multimedia, SEO   |
| Sales     | Leads (lectura/escritura de seguimiento), lectura pública datos |
| Viewer    | Solo lectura (opcional)                                 |

Detalle fino de permisos → documento `SECURITY.md` y `BACKOFFICE_ARCHITECTURE.md`.

---

## 11. Requisitos no funcionales

### 11.1 Performance

- Percepción de carga instantánea.
- Lighthouse Performance ≥ 95 en páginas clave (home, listados, detalle, servicios).
- Imágenes AVIF/WebP, lazy loading, optimización automática.
- Excelente Core Web Vitals (LCP, INP, CLS).

### 11.2 SEO

- Arquitectura de URLs limpia y estable.
- Metadata, OG, canonical, sitemap, robots.
- Contenido indexable server-rendered o estático según estrategia.
- Schema.org donde aporte (Vehicle, Service, LocalBusiness, FAQ cuando exista).
- Prioridad: vehículos, servicios, llaves, oportunidades.

### 11.3 Seguridad

- Lógica sensible solo en servidor.
- Validación de toda escritura.
- Control de permisos en backoffice.
- Sin exposición de información privada (costos, proveedores, notas internas, PII de leads en público).
- Protección CSRF/auth según stack; rate limiting en formularios/leads.

### 11.4 Accesibilidad

- Objetivo: WCAG 2.2 AA en flujos críticos (navegación, formularios, CTAs, galerías).
- Contraste, foco visible, textos alternativos, semántica correcta.

### 11.5 Internacionalización / locale

- v1: ES-MX únicamente.
- Formatos de fecha/moneda locales (México).
- Mercado operativo inicial: CDMX y Área Metropolitana; modelo listo para expansión nacional.
- Preparación estructural para i18n futuro (sin implementar UI multiidioma en v1).

### 11.5.1 Identidad de dominio

- Dominio canónico previsto: `autointegral.mx` (pendiente confirmación de disponibilidad).
- Configuración de dominio vía entorno/settings; cambio de dominio sin cambios estructurales.

### 11.6 Observabilidad (mínimo v1)

- Errores de servidor y cliente (servicio de error tracking).
- Métricas básicas de leads y publicación.
- Logs de autenticación y acciones críticas de admin (detalle en Security).

---

## 12. Design system y UX (alcance de producto)

Antes del desarrollo de UI:

- Colores, tipografía, espaciado, motion.
- Botones, inputs, tablas, badges, modales, galerías.
- Reglas de composición (hero, secciones, ritmo editorial).
- Documentación en `DESIGN_SYSTEM.md`, `UI_UX_GUIDELINES.md`, `COMPONENT_LIBRARY.md`.

**Regla de componentes:** un solo componente configurable (ej. un `MediaGallery`, un `EntityCard` / patrón de card de entidad si se justifica por interacción). No variantes duplicadas por breakpoint o contexto.

---

## 13. Datos y contenido

### 13.1 Principio

El modelo de datos se diseña → revisa → aprueba → **congela** antes de construir features encima. Cambios posteriores solo por necesidad real y versionados.

### 13.2 Entidades de alto nivel (preview; detalle en DATABASE_ARCHITECTURE)

- User / Role
- Vehicle (Inventario)
- Opportunity
- Service (Centro) / KeyService (o Service con `unit`)
- Lead + LeadNote / LeadStatusHistory
- MediaAsset + vínculos polimórficos o tablas de unión
- SiteSettings / SEO fields por entidad
- Page content (CMS ligero para Home, Nosotros, Cómo Comprar) — **propuesta**

**Decisión P8 (aprobada):** Home / Nosotros / Cómo Comprar (y páginas institucionales) editables vía **CMS estructurado de bloques limitados**. Sin page-builder libre.

---

## 14. Métricas de éxito (lanzamiento y 90 días)

| Métrica                         | Meta inicial (a calibrar con negocio)      |
|---------------------------------|--------------------------------------------|
| Lighthouse (páginas clave)      | ≥ 95                                       |
| LCP móvil                       | ≤ 2.5s en conexiones de referencia         |
| Leads registrados / semana      | Baseline + crecimiento                     |
| % leads con seguimiento a tiempo| Definir SLA interno (ej. < 24h)            |
| Páginas de servicio indexadas   | 100% del catálogo publicado                |
| Bounce en detalle de vehículo   | Monitorear; mejorar contenido/galería      |

---

## 15. Definición de terminado (DoD) — producto

Un módulo no está “terminado” hasta cumplir:

- [ ] TypeScript limpio  
- [ ] Lint limpio  
- [ ] Tests acordados para el módulo  
- [ ] Responsive (mobile first verificado)  
- [ ] Accesibilidad en flujos del módulo  
- [ ] SEO del módulo (si aplica)  
- [ ] Performance del módulo (si aplica UI pública)  
- [ ] Sin componentes duplicados  
- [ ] Sin deuda conocida aceptada sin ticket explícito  

---

## 16. Roadmap de fases (resumen)

| Fase | Nombre                 | Gate de salida                                      |
|------|------------------------|-----------------------------------------------------|
| 0    | Arquitectura completa  | Docs aprobados uno a uno                            |
| 1    | Design System          | Tokens + componentes base aprobados                 |
| 2    | Modelo de datos        | Schema congelado                                    |
| 3    | Backoffice             | Módulos operativos con DoD                          |
| 4    | Frontend público       | Sitio completo con DoD                              |
| 5    | Testing                | Suite y criterios de calidad cumplidos              |
| 6    | Optimización           | Lighthouse/CWV y SEO técnico OK                     |
| 7    | Lanzamiento            | Go-live checklist                                   |

Detalle → `DEVELOPMENT_ROADMAP.md` (último documento de la serie de Fase 0, tras los demás).

---

## 17. Glosario

| Término        | Significado                                                                 |
|----------------|-----------------------------------------------------------------------------|
| Vehículos      | Accidentados, recuperados y seminuevos publicados para consulta             |
| Oportunidad    | Vehículo curado de la selección semanal en subastas; solo solicitud de info |
| Lead           | Solicitud registrada con origen y estado de seguimiento                     |
| Servicios      | Centro Automotriz + Llaves Automotrices (únicos frentes de servicio)        |
| Centro         | Servicios de taller, mantenimiento y estética automotriz                    |
| Llaves         | Programación y soluciones de llaves automotrices (bajo Servicios)           |
| Público        | Sitio visible a visitantes                                                  |
| Backoffice     | Panel administrativo interno                                                |
| Editorial      | Estilo de presentación: espacio, foto, tipografía, poca densidad            |

---

## 18. Decisiones P1–P10 — estado final

| ID  | Tema                                      | Decisión final                                                                 | Estado    |
|-----|-------------------------------------------|--------------------------------------------------------------------------------|-----------|
| P1  | Lead-first antes de WhatsApp              | Sí; campos mínimos obligatorios definidos                                      | Aprobado  |
| P2  | Llaves: misma marca + look propio         | Sí; escisión futura sin reescribir núcleo                                      | Aprobado  |
| P3  | Estados de oportunidad + historial        | 7 estados; sin borrado físico                                                  | Aprobado  |
| P4  | Solo ES-MX en v1 + i18n-ready             | Sí                                                                             | Aprobado  |
| P5  | CDMX / AM + expansión nacional            | Sí                                                                             | Aprobado  |
| P6  | Cómo Comprar (7 pasos reales)             | Sí                                                                             | Aprobado  |
| P7  | Stack moderno estable                     | Dirección OK; detalle en SYSTEM_ARCHITECTURE                                   | Aprobado  |
| P8  | CMS bloques limitados                     | Sí; sin page builder                                                           | Aprobado  |
| P9  | Dominio `autointegral.mx`                 | Default; cambio de dominio sin impacto estructural; disponibilidad pendiente   | Pendiente |
| P10 | WhatsApp multi-número por unidad          | Sí; configurable sin código                                                    | Aprobado  |

---

## 19. Historial de cambios

| Versión | Fecha       | Autor            | Cambio                                                                 |
|---------|-------------|------------------|------------------------------------------------------------------------|
| 0.1.0   | 2026-07-19  | Arquitectura AI  | Borrador inicial para revisión stakeholder                             |
| 1.0.0   | 2026-07-19  | Arquitectura AI  | Aprobado con cambios: P1–P10, mercado CDMX, proceso compra, multi-WA   |

---

## 20. Aprobación

| Rol            | Nombre | Fecha      | Firma / OK |
|----------------|--------|------------|------------|
| Product Owner  | —      | 2026-07-19 | APROBADO CON CAMBIOS |
| Diseño         |        |            |            |
| Ingeniería     |        |            |            |

**Estado del documento:** `APPROVED` (P9 dominio pendiente de disponibilidad, sin bloquear arquitectura)

Siguiente documento: **`SYSTEM_ARCHITECTURE.md`**.
`)