# Reglas de diseño — MAC Portal

Referencia rápida para quien (persona o agente de IA) siga construyendo sobre este repo. El objetivo es que toda pantalla nueva se sienta parte del mismo sistema.

## Tokens, no valores sueltos

Todo color sale de las variables definidas en `src/app/globals.css` (`--primary`, `--muted`, `--success`, `--warning`, `--destructive`, etc.) y se consume vía las clases de Tailwind que las mapean (`bg-primary`, `text-muted-foreground`, `border-border`...). No se usan valores hex/rgba sueltos en `className`. Excepciones válidas: `src/lib/network-meta.ts` y archivos de configuración de librerías externas que lo exijan.

Hay modo claro y oscuro (`.dark` en `globals.css`, toggle en `src/components/shared/mode-toggle.tsx`) — cualquier color nuevo necesita su variante para ambos modos.

## Tipografía

Fuente Inter (self-hosted, `src/fonts/inter-variable.woff2`, ver `layout.tsx`). Los montos y números tabulares (KPIs, precios, fechas en tablas) siempre llevan la clase `tabular-nums`. Los labels de sección van en mayúsculas con tracking amplio: `text-xs font-medium uppercase tracking-wider text-muted-foreground`.

## Íconos

Lucide (`lucide-react`), siempre `strokeWidth={1.5}` a `1.75`, tamaño `size-4` en UI de línea y `size-8`+ en estados vacíos/ilustrativos. **Ojo:** `lucide-react` v1 sacó los íconos de marca (Instagram, YouTube, TikTok, etc.) — para esos casos usamos íconos genéricos equivalentes (`Camera`, `PlaySquare`, `Music2` — ver `src/lib/network-meta.ts`), nunca inventamos un ícono con SVG propio salvo que sea imprescindible.

## Componentes

`src/components/ui/*` son primitivas estilo shadcn/ui (Radix + `class-variance-authority`) — no las instalamos vía la CLI de shadcn porque este sandbox no tiene salida de red hacia `ui.shadcn.com`; están escritas a mano siguiendo exactamente el mismo patrón (`data-slot`, `cn()`, `cva()`). Si más adelante tenés red disponible, `npx shadcn@latest add <componente>` va a generar componentes 100% compatibles con estos.

Nunca importar Server Actions (`@/app/actions/*`) desde `src/components/ui/*` — esas primitivas tienen que ser reutilizables sin acoplarse a lógica de negocio (lo valida `scripts/check-rules.mjs`).

## Estados de carga y feedback

- Listas/tablas que dependen de datos externos (Drive, sockets) muestran `<Skeleton />` mientras cargan, nunca un spinner de página completa.
- Confirmaciones/errores de acciones van por `sonner` (`toast.success` / `toast.error`), nunca `alert()`.
- Botones con una Server Action en curso muestran `<Loader2 className="animate-spin" />` y quedan `disabled`.

## Badges de estado (semántica de color)

`success` = verde (aprobado, publicado, firmado) · `warning` = ámbar (por aprobar, pendiente) · `destructive` = rojo (requiere cambios) · `info` = azul (en curso/programado) · `secondary` = neutro (borrador, sin estado). Ver `src/components/dashboard/content-status-badge.tsx` como referencia canónica.

## RBAC en cada capa nueva

Cualquier página nueva bajo `/admin`, `/editor` o `/client` **tiene** que llamar a `requireRole([...])` o `requireAdmin()` al principio, aunque el `proxy.ts` raíz ya filtre por prefijo de ruta — es defensa en profundidad, y `scripts/check-rules.mjs` lo exige. Cualquier tabla nueva en Supabase necesita sus propias políticas RLS antes de mergear (no hay tablas "de confianza" sin RLS).
