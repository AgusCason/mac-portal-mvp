# MAC Portal

Portal SaaS multi-rol para que MAC (agencia de edición audiovisual y marketing digital) gestione clientes, contenido, calendario editorial, contratos, redes sociales y WhatsApp desde un solo lugar — inspirado en el modelo de MB-Suite.

Stack: **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + componentes estilo shadcn/ui (Radix)** en el frontend, **Supabase (Postgres + Auth + RLS)** como backend, deploy en **Netlify**, archivos en **Google Drive** vía Service Account.

---

## 1. Qué incluye este repo

- **RBAC completo** con 3 roles (`admin`, `editor`, `client`), enforced en tres capas: Row Level Security en Postgres, `proxy.ts` (antes "middleware", ver nota más abajo) y `requireRole()` en cada página.
- **Módulo A — Drive:** al crear un cliente se generan automáticamente 3 carpetas en Google Drive (`Crudos`, `En Edición`, `Entregables Finales`) vía Service Account, con previsualizador integrado.
- **Módulo B — Calendario editorial:** tablero Kanban con el flujo `Borrador → En Edición → Por Aprobar → Requiere Cambios → Aprobado → Programado → Publicado`, aprobación de un clic para el cliente.
- **Módulo C — Contratos:** carga de documentos, estado Firmado/Pendiente con trazabilidad de fecha, firma por parte del cliente vía RPC segura.
- **Módulo D — Redes sociales (Fase Avanzada):** modelo de datos + flujo OAuth de Meta listo; requiere que completes credenciales reales de Meta/TikTok/YouTube para pasar de "conectar cuenta" a datos en vivo.
- **Módulo E — Chat (WhatsApp):** bandeja tipo CRM por cliente + webhook receptor de WhatsApp Cloud API.
- **Asistente IA (Claude, solo Admin):** chat integrado en `/admin/asistente` que puede leer datos de la agencia y *proponer* arreglos — nunca ejecuta nada sin confirmación humana explícita. Ver sección 10.
- **Dashboard adaptativo por rol** (`src/components/dashboard/role-dashboard.tsx`) — ver sección 4.
- **Sistema de checkeo** (`npm run verify`) que corre lint + typecheck + reglas propias + build antes de dar nada por terminado — ver sección 6.

## 2. Nota importante: Next.js 16

Este proyecto usa **Next.js 16**, que renombró `middleware.ts` a **`proxy.ts`** (la función exportada se llama `proxy`, no `middleware`). Es un cambio reciente del framework — si alguna vez agregás lógica de proxy/middleware nueva, hacelo en `src/proxy.ts` siguiendo esa convención, no crees un `middleware.ts`.

## 3. Estructura de carpetas y arquitectura de rutas (Entregable 1)

```
mac-portal/
├── src/
│   ├── proxy.ts                      # RBAC a nivel de ruta (ver nota Next 16 arriba)
│   ├── middleware… → ver proxy.ts
│   ├── app/
│   │   ├── layout.tsx                # ThemeProvider, fuente Inter self-hosted, Toaster
│   │   ├── page.tsx                  # Redirige a /login o /{role}
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── login-form.tsx        # Client Component (useSearchParams + Supabase Auth)
│   │   ├── no-autorizado/page.tsx
│   │   │
│   │   ├── admin/                    # Solo role=admin (enforced por proxy + requireRole)
│   │   │   ├── layout.tsx            # AppShell con nav de admin
│   │   │   ├── page.tsx              # Dashboard admin (RoleDashboard)
│   │   │   ├── clientes/
│   │   │   │   ├── page.tsx          # Listado + alta de cliente
│   │   │   │   └── [id]/page.tsx     # Ficha 360: plan, editores, Drive, contratos
│   │   │   ├── equipo/page.tsx       # Editores + invitación + asignaciones
│   │   │   ├── calendario/page.tsx   # Kanban global
│   │   │   ├── contratos/page.tsx    # Contratos de todos los clientes
│   │   │   ├── redes/page.tsx        # Métricas sociales (Fase Avanzada)
│   │   │   ├── chat/page.tsx         # Bandeja por cliente
│   │   │   ├── planes/page.tsx       # Financiero — SOLO admin
│   │   │   └── configuracion/page.tsx
│   │   │
│   │   ├── editor/                   # Solo role=editor
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard editor (solo clientes asignados)
│   │   │   ├── calendario/page.tsx
│   │   │   ├── drive/page.tsx        # Gate adicional: can_view_drive
│   │   │   └── chat/page.tsx         # Gate adicional: can_view_chat
│   │   │
│   │   ├── client/                   # Solo role=client
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard cliente
│   │   │   ├── calendario/page.tsx   # Aprobar / pedir cambios
│   │   │   ├── drive/page.tsx
│   │   │   ├── contratos/page.tsx    # Firmar contratos
│   │   │   └── chat/page.tsx
│   │   │
│   │   ├── actions/                  # Server Actions (ver sección 5)
│   │   │   ├── clients.ts
│   │   │   ├── editors.ts
│   │   │   ├── content.ts
│   │   │   ├── drive.ts
│   │   │   ├── contracts.ts
│   │   │   ├── chat.ts
│   │   │   ├── plans.ts
│   │   │   ├── team.ts
│   │   │   └── client-members.ts
│   │   │
│   │   └── api/
│   │       ├── webhooks/whatsapp/route.ts   # Webhook WhatsApp Cloud API
│   │       └── oauth/meta/connect/route.ts  # Inicio del flujo OAuth de Meta
│   │
│   ├── components/
│   │   ├── ui/            # Primitivas estilo shadcn (Button, Card, Dialog, Table...)
│   │   ├── dashboard/      # KpiCard, badges de estado, y los 3 dashboards + adaptador
│   │   ├── content/        # ContentBoard (Kanban) + diálogo de nueva pieza
│   │   ├── drive/          # DriveBrowser (previsualizador)
│   │   ├── contracts/, chat/, clients/, team/, plans/, shared/
│   │
│   ├── lib/
│   │   ├── supabase/       # client.ts, server.ts, middleware.ts (helpers de sesión)
│   │   ├── queries/        # 1 función por consulta de lectura (RLS-aware)
│   │   ├── auth.ts         # requireRole / requireAdmin / getCurrentProfile
│   │   ├── google-drive.ts # Integración Drive API (Service Account)
│   │   ├── nav-config.ts   # Navegación por rol
│   │   └── utils.ts
│   │
│   ├── types/database.ts   # Tipos manuales alineados al schema SQL
│   └── fonts/               # Inter self-hosted (evita depender de Google Fonts en build)
│
├── supabase/migrations/     # SQL a pegar en el SQL Editor de Supabase
├── scripts/check-rules.mjs  # Sistema de checkeo propio (ver sección 6)
├── .github/workflows/ci.yml
├── netlify.toml
└── .env.example
```

## 4. Dashboard adaptativo por rol (Entregable 3)

`src/components/dashboard/role-dashboard.tsx` es un **Server Component** que recibe el `profile` ya autenticado y decide qué vista renderizar:

```tsx
// src/app/admin/page.tsx
const profile = await requireRole(["admin"]);
return <RoleDashboard profile={profile} />;

// src/app/client/page.tsx
const profile = await requireRole(["client"]);
const clientId = await getPrimaryClientId(profile.id);
return <RoleDashboard profile={profile} clientId={clientId} />;
```

Cada rama (`AdminDashboard`, `EditorDashboard`, `ClientDashboard`) llama a su **propia** función de datos (`getAdminDashboardData`, `getEditorDashboardData`, `getClientDashboardData` en `src/lib/queries/dashboard.ts`), acotada además por RLS — así no existe una sola ruta de código por la que un editor o cliente pueda llegar a ver datos de otro tenant o información financiera. El admin ve KPIs de negocio (clientes activos, facturación, editores), el editor ve solo sus clientes asignados sin datos financieros, y el cliente ve su propio contenido pendiente de aprobación y su plan.

## 5. Flujo de RBAC + integración con Google Drive (Entregable 2)

**Alta de cliente** (`src/app/actions/clients.ts#createClientAction`, solo admin):

1. Valida rol con `requireAdmin()`.
2. Inserta la fila en `clients`.
3. Llama a `createClientDriveStructure()` (`src/lib/google-drive.ts`), que crea `<Root>/<Cliente>/{Crudos, En Edición, Entregables Finales}` con la Service Account y devuelve los folder IDs.
4. Guarda esos IDs en `drive_folders`.
5. Si se eligió un plan, crea la fila en `client_plans`.

**Asignación granular de editor → cliente** (`src/app/actions/editors.ts#assignEditorToClientAction`, solo admin): upsert en `editor_client_assignments` con `can_view_chat` y `can_view_drive` independientes. Esas dos columnas son la fuente de verdad — se leen tanto en la UI (para mostrar/ocultar el módulo) como en RLS (para bloquear el acceso a nivel de base, no solo de interfaz).

**Lectura de archivos de Drive** (`src/app/actions/drive.ts#getClientDriveFilesAction`): antes de tocar la API de Drive, hace un `select` a `drive_folders` con el cliente Supabase del usuario logueado. Si RLS no le da acceso (editor sin `can_view_drive`, o cliente que no es dueño), la query no devuelve filas y la función corta ahí — la Service Account de Drive nunca se invoca para un usuario no autorizado.

**Aprobación de contenido por el cliente** (`src/app/actions/content.ts#reviewContentAction`): en vez de darle al cliente `UPDATE` directo sobre `content_items` (que le permitiría tocar cualquier campo), pasa por la función Postgres `set_content_approval` (`SECURITY DEFINER`), que solo permite setear `status` a `aprobado` o `requiere_cambios` sobre contenido de su propio cliente, y opcionalmente deja un comentario de feedback. Mismo patrón para la firma de contratos (`sign_contract`).

## 6. Sistema de checkeo (verificación antes de dar algo por terminado)

```bash
npm run verify
```

Corre, en orden, y se detiene en el primer error:

1. `npm run lint` — ESLint (incluye reglas de React Hooks/Server Components de Next 16).
2. `npm run typecheck` — `tsc --noEmit`.
3. `npm run check:rules` — `scripts/check-rules.mjs`: escaneo propio que exige, por ejemplo, que toda Server Action tenga `"use server"`, que ninguna página bajo `/admin`, `/editor` o `/client` omita `requireRole()`, que la Service Role Key de Supabase solo se referencie desde `lib/supabase/server.ts`, y que no queden `console.log` de debug.
4. `npm run build` — build real de producción (Next 16 + Turbopack).

`.github/workflows/ci.yml` corre `npm run verify` en cada push/PR a `main`. Este repo se entregó **después** de correr `npm run verify` con éxito (lint limpio, 0 errores de TypeScript, 0 violaciones de reglas propias, build de producción generando las 25 rutas).

## 7. Setup — de cero a desplegado

### 7.1 Supabase

1. Creá cuenta/proyecto en [supabase.com](https://supabase.com) (plan free alcanza para empezar).
2. `SQL Editor > New query`, pegá y ejecutá **en este orden**:
   - `supabase/migrations/0001_schema.sql` (tablas + RLS + triggers)
   - `supabase/migrations/0002_seed.sql` (3 planes de ejemplo — opcional)
   - `supabase/migrations/0003_contract_signing.sql` (firma de contratos)
   - `supabase/migrations/0004_ai_assistant.sql` (Asistente IA — tablas + RLS, ver sección 10)
   - `supabase/migrations/0005_platform_v2.sql` a `0008_reports_storage.sql` (redes sociales, facturación, reportes)
   - `supabase/migrations/0009_activity_notifications.sql` a `0014_metric_alerts.sql` (adaptación "estilo MB Suite": actividad/notificaciones, filtros de reportes, branding, CRM, bóveda de credenciales cifradas, alertas de métricas — ver sección 11)
3. `Project Settings > API`: copiá `Project URL`, `anon public key` y `service_role key`.
4. Creá tu primer usuario admin: `Authentication > Users > Add user`, y luego en `Table Editor > profiles` editá su fila para poner `role = admin` (el trigger lo crea con `role = client` por default si no mandaste metadata).

### 7.2 Google Drive

1. [Google Cloud Console](https://console.cloud.google.com) → nuevo proyecto → habilitar **Google Drive API**.
2. `IAM & Admin > Service Accounts` → crear una → `Keys > Add key > JSON` (se descarga un archivo).
3. Del JSON descargado, copiá `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL` y `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
4. En Google Drive, creá la carpeta raíz de la agencia, compartila con ese `client_email` como **Editor**, y copiá su ID (de la URL) a `GOOGLE_DRIVE_ROOT_FOLDER_ID`.

### 7.3 WhatsApp Cloud API (Módulo E)

1. [Meta for Developers](https://developers.facebook.com) → tu App → producto **WhatsApp**.
2. `Configuration > Webhook`: Callback URL = `https://tu-sitio.netlify.app/api/webhooks/whatsapp`, Verify token = el mismo valor que pusiste en `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
3. Suscribite al campo `messages`.

### 7.4 Meta Graph API (Módulo D, Fase Avanzada)

1. En la misma Meta App, agregá el producto **Facebook Login for Business** + **Instagram Graph API**.
2. Cargá `META_APP_ID` y `META_APP_SECRET`.
3. El botón "Conectar Instagram" en `/admin/redes` ya arma la URL de autorización — falta implementar `/api/oauth/meta/callback` para intercambiar el `code` por un token de larga duración (no incluido: requiere que Meta apruebe la app para el scope `instagram_manage_insights`).

### 7.5 Asistente IA (Claude)

1. [console.anthropic.com](https://console.anthropic.com) → `API Keys` → creá una key.
2. Cargá `ANTHROPIC_API_KEY` (y opcionalmente `ANTHROPIC_MODEL`, default `claude-sonnet-4-5`).
3. Sin esta variable, el resto de la plataforma funciona igual — solo `/admin/asistente` muestra el error correspondiente al intentar mandar un mensaje.

### 7.6 Netlify

1. `netlify.toml` ya está configurado con `@netlify/plugin-nextjs` (soporta Server Actions, Route Handlers y `proxy.ts` de Next 16 sin configuración adicional).
2. En Netlify: `Add new site > Import from Git` (o `netlify deploy` desde la CLI).
3. `Site configuration > Environment variables`: cargá las mismas variables de `.env.example`.
4. Deploy. Netlify corre `npm run build` automáticamente.

## 8. Roles y permisos — resumen

| | Admin | Editor | Cliente |
|---|---|---|---|
| Ver todos los clientes | ✅ | Solo asignados | Solo el propio |
| Ver planes / facturación | ✅ | ❌ (RLS bloquea) | Solo su plan (nombre, sin editar) |
| Asignar editores | ✅ | ❌ | ❌ |
| Ver Drive de un cliente | ✅ | Si `can_view_drive` | Propio |
| Ver chat de un cliente | ✅ | Si `can_view_chat` | Propio |
| Crear/mover contenido | ✅ | Solo sus clientes | ❌ (solo aprobar/pedir cambios) |
| Contratos | ✅ | ❌ | Ver y firmar los propios |
| Asistente IA | ✅ | ❌ (no ve la feature) | ❌ (no ve la feature) |

## 9. Limitaciones conocidas y próximos pasos

- **Módulo D (redes sociales):** el modelo de datos y el botón de conexión están listos, pero el callback OAuth de Meta (`/api/oauth/meta/callback`) y la sincronización periódica de métricas (`social_metrics`) quedan para cuando tengas la app de Meta aprobada para los scopes de Insights.
- **WhatsApp saliente real:** `sendChatMessageAction` guarda el mensaje en Supabase (aparece en el CRM), pero no llama todavía a la WhatsApp Cloud API para enviarlo de verdad — falta agregar esa llamada con el token de la cuenta de negocio.
- **Un cliente = una fila en `client_members`, pero el schema soporta N usuarios por cliente** (por si mañana un mismo cliente quiere loguear a dos personas de su equipo).
- **Subida de archivos a Drive:** `createResumableUploadSession()` en `lib/google-drive.ts` deja el punto de entrada para subida con barra de progreso desde el navegador; falta cablear el componente de upload en `/client/drive`.
- **Tipos de Supabase:** `src/types/database.ts` está escrito a mano para que el proyecto compile sin necesitar la CLI de Supabase. Una vez que tengas el proyecto real, es más prolijo regenerarlos con `npx supabase gen types typescript --project-id <id> > src/types/database.ts`.
- **Branding (Fase 3.1):** hoy se aplican de verdad nombre, logos, favicon, color primario/acento y forma de los botones. Tipografía (`font_heading`/`font_body`) y estilo de botón (relleno/contorno) quedan guardados en `agency_branding` para más adelante, pero no wireados — cargar fuentes dinámicamente rompería el self-hosting deliberado de Inter (ver `src/app/layout.tsx`), y el estilo de botón requeriría reescribir el `variant` de cada `<Button>` del código a mano.
- **Bóveda de credenciales (Fase 3.3):** el secreto se cifra con pgcrypto y la passphrase (`VAULT_ENCRYPTION_KEY`) nunca se guarda en la base — pero si esa env var se filtra junto con un dump de la base, sí se puede descifrar todo. Es el mismo modelo de amenaza que cualquier secreto de aplicación (como `SUPABASE_SERVICE_ROLE_KEY`); no reemplaza un secret manager dedicado (Vault, AWS Secrets Manager) si en algún momento lo necesitás.
- **CRM (Fase 3.2):** pipeline de prospectos comerciales, sin relación automática con `clients` — cuando ganás un prospecto, el alta como Cliente real sigue siendo un paso manual en `/admin/clientes` (por diseño: son dos conceptos distintos, cliente contratado vs. prospecto).
- **Alertas de métricas (Fase 3.4):** el cron (`notify-metric-drops.ts`) compara la última lectura de `social_metrics` contra el promedio de hasta 7 lecturas previas; necesita al menos 4 días de historial por cuenta para empezar a alertar, así que una cuenta recién conectada no genera alertas hasta acumular datos.
- **White-label multi-tenant real** (subdominio o dominio propio por cliente/agencia) no está incluido — `agency_branding` es una única fila (singleton) para toda la instalación, pensado para una agencia usando su propio despliegue, no para que MAC Portal aloje múltiples agencias con marcas distintas en la misma base. Eso requeriría infraestructura de DNS/hosting adicional que esta sesión no controla.

## 10. Asistente IA (Claude dentro de la plataforma)

`/admin/asistente` integra la API de Claude para que el propio administrador tenga un asistente dentro del portal que lo ayude a mantenerlo sano — sin que eso abra una puerta lateral a los datos de los clientes. El diseño sigue tres reglas, todas verificables en el código:

**1) Nunca actúa solo — siempre hay confirmación humana.** El modelo puede llamar libremente a tres tools de solo lectura (`list_clients`, `get_client_detail`, `find_data_issues` en `src/lib/ai/tools.ts`), pero la única forma de tocar un dato es a través de `propose_change`, una tool que **arma una propuesta y para ahí** (`src/lib/ai/client.ts`). Esa propuesta queda guardada en `ai_messages.pending_action` + un registro `ai_audit_log` en estado `proposed`, y se renderiza como una tarjeta con botones "Confirmar"/"Rechazar" (`ProposalCard`, `src/components/ai-assistant/proposal-card.tsx`). La mutación real solo ocurre en `confirmAiActionAction` (`src/app/actions/ai-assistant.ts`), tras el clic del admin, y pasa por el mismo catálogo cerrado y validado con zod que usaría cualquier otra acción administrativa (`ACTION_SCHEMAS`/`executeAction` en `src/lib/ai/actions-registry.ts`) — nunca SQL libre, nunca una tool genérica de "ejecutar lo que sea".

**2) RLS es el piso de seguridad, no una capa opcional.** Todas las tools de lectura y de ejecución reciben el cliente de Supabase del admin autenticado (`createClient()` de `lib/supabase/server.ts`) — **nunca** la Service Role Key. Esto significa que, aunque hubiera un bug en el código del asistente, Postgres sigue sin dejarlo ver ni tocar más de lo que ese admin ya podría por RLS. Por diseño, solo el rol `admin` accede a la feature: `proxy.ts` protege `/admin/*`, `requireRole(["admin"])` la revalida en la página, y las policies de `ai_conversations`/`ai_messages`/`ai_audit_log` (migración `0004_ai_assistant.sql`) restringen todo a filas del propio admin (el audit log es la única excepción: cualquier admin puede leerlo completo, para supervisión cruzada).

**3) Minimización de datos + auditoría completa.** Cada tool de lectura hace `select()` explícito de columnas puntuales — nunca `select("*")` sobre algo que pueda traer tokens, contraseñas o claves de Drive/Meta/WhatsApp — y trunca listados (ver comentarios en `src/lib/ai/tools.ts`). Todo lo que el asistente propone queda en `ai_audit_log` con su `diff` (antes/después) y su resultado final (`executed`, `rejected` o `failed`), visible en la pestaña "Auditoría" de `/admin/asistente` (`AuditLogTable`).

En resumen: Claude puede *ver* (con el mismo límite que el admin que lo está usando) y puede *proponer*, pero jamás *ejecuta* — ese último paso es siempre, sin excepción, un clic humano.

## 11. Adaptación "estilo MB Suite" (Fase 1-3)

Sobre la base del Entregable original, se sumó una adaptación visual y funcional inspirada en MB Suite, en 3 fases — cada una verificada con `npm run verify` + `npm run build` antes de pasar a la siguiente.

**Fase 1 — Identidad y navegación.**
- Sidebar en acordeón (grupos "Comercial" y "Configuración" colapsables) — `src/lib/nav-config.ts` + `AppShell`.
- Paneles deslizantes de Actividad y Notificaciones, alimentados por triggers de Postgres (nunca por código de aplicación que se pueda olvidar de llamarlos) — `0009_activity_notifications.sql`.
- Selector de tema (claro/oscuro/sistema) en un panel propio, reemplazando el toggle simple.
- Identidad de los agentes de IA: **Nova** (reportes, `src/lib/ai/agents.ts`) y **Max** (asistente conversacional) — atribución visible donde generan contenido.

**Fase 2 — Reportes, mini-workspace y kanban.**
- Filtros de reportes por cliente/estado/período, sincronizados a la URL (`report-filters.tsx`).
- Ficha de cliente reorganizada en tabs (Resumen/Contenido/Reportes/Contratos/Facturación) — `/admin/clientes/[id]`.
- Drag-and-drop real en el calendario editorial (`@dnd-kit/core`), preservando la regla de que solo el flujo de Entrega (con archivo subido a Drive) puede mover una pieza a "Por Aprobar".
- Catálogo de módulos (`/admin/configuracion/modulos`) — índice informativo de todo lo que tiene la plataforma; no gatea nada todavía (ver limitación más abajo si en algún momento se quiere activar/desactivar módulos de verdad).

**Fase 3 — Comercial y plataforma.**
- **Branding white-label** (`/admin/configuracion/marca`, `0011_branding.sql`): nombre, logos, favicon, color primario/acento y forma de botones, aplicados vía CSS custom properties inyectadas en `src/app/layout.tsx`.
- **CRM liviano** (`/admin/crm`, `0012_crm.sql`): pipeline de prospectos con kanban drag-and-drop (Nuevo → Contactado → Calificado → Propuesta → Ganado/Perdido).
- **Bóveda de credenciales** (`/admin/configuracion/boveda`, `0013_vault.sql`): secretos cifrados con pgcrypto, descifrado solo bajo demanda — requiere la variable de entorno `VAULT_ENCRYPTION_KEY` (ver `.env.example`).
- **Alertas de métricas** (`0014_metric_alerts.sql` + `netlify/functions/notify-metric-drops.ts`): cron diario que detecta caídas de 30%+ en alcance/seguidores vs. el promedio de los días previos, genera una notificación interna y un resumen en el dashboard de admin.

Ver la sección 9 (arriba) para el detalle de qué quedó deliberadamente fuera de alcance de esta adaptación y por qué.
