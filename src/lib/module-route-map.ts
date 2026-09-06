/**
 * Mapea rutas -> `ModuleEntry.key` de modules-catalog.ts, para que el on/off
 * real (module_flags) sepa qué ítem de sidebar / página corresponde a qué
 * módulo. Sin "server-only": lo usa tanto proxy.ts (Edge) como el filtro de
 * sidebar en app-shell.tsx ("use client").
 *
 * No todos los ítems de NAV_CONFIG están acá — solo los que ya existen como
 * módulo propio en el catálogo. Lo que no matchea ningún prefijo (Dashboard,
 * Analytics en general, etc.) queda siempre visible, sin gating.
 */
export const ROUTE_MODULE_MAP: { prefix: string; key: string }[] = [
  { prefix: "/admin/social-media", key: "redes-sociales" },
  { prefix: "/admin/redes", key: "redes-insights" },
  { prefix: "/admin/calendario", key: "calendario" },
  { prefix: "/editor/calendario", key: "calendario" },
  { prefix: "/client/calendario", key: "calendario" },
  { prefix: "/admin/analytics/alertas", key: "alertas-metricas" },
  { prefix: "/admin/analytics/dashboards", key: "analytics-dashboards" },
  { prefix: "/admin/analytics/explorer", key: "analytics-explorer" },
  { prefix: "/admin/analytics/envios", key: "analytics-envios" },
  { prefix: "/admin/analytics/utm-builder", key: "analytics-utm-builder" },
  // Genérico: debe ir después de los prefijos más específicos de /admin/analytics/* de arriba.
  { prefix: "/admin/analytics", key: "analytics-overview" },
  { prefix: "/admin/reportes", key: "reportes-ia" },
  { prefix: "/client/reportes", key: "reportes-ia" },
  { prefix: "/admin/clientes", key: "cuentas" },
  { prefix: "/admin/equipo", key: "equipo" },
  { prefix: "/admin/finanzas-equipo", key: "finanzas-equipo" },
  { prefix: "/admin/finanzas/herramientas", key: "herramientas" },
  // Genérico: debe ir después de /admin/finanzas/herramientas (más específico) de arriba.
  { prefix: "/admin/finanzas", key: "finanzas" },
  { prefix: "/editor/finanzas", key: "finanzas-equipo" },
  { prefix: "/admin/herramientas", key: "herramientas" },
  { prefix: "/editor/herramientas", key: "herramientas" },
  { prefix: "/admin/contratos", key: "contratos" },
  { prefix: "/client/contratos", key: "contratos" },
  { prefix: "/admin/tareas", key: "tareas" },
  { prefix: "/editor/tareas", key: "tareas" },
  { prefix: "/admin/proyectos", key: "proyectos" },
  { prefix: "/admin/sitios-web", key: "sitios-web" },
  { prefix: "/client/sitio-web", key: "sitios-web" },
  { prefix: "/admin/contactos", key: "contactos" },
  { prefix: "/admin/media-library", key: "media-library" },
  { prefix: "/admin/knowledge-base", key: "knowledge-base" },
  { prefix: "/admin/web-forms", key: "web-forms" },
  { prefix: "/editor/drive", key: "drive" },
  { prefix: "/client/drive", key: "drive" },
  { prefix: "/admin/chat", key: "chat" },
  { prefix: "/editor/chat", key: "chat" },
  { prefix: "/client/chat", key: "chat" },
  { prefix: "/admin/planes", key: "planes-facturacion" },
  { prefix: "/client/facturas", key: "planes-facturacion" },
  { prefix: "/admin/crm", key: "crm" },
  { prefix: "/admin/asistente", key: "asistente-ia" },
  { prefix: "/admin/configuracion/modulos", key: "config-modulos" },
  { prefix: "/admin/configuracion/marca", key: "config-marca" },
  { prefix: "/admin/configuracion/boveda", key: "config-boveda" },
  { prefix: "/admin/configuracion/auditoria", key: "config-auditoria" },
  { prefix: "/admin/actividad", key: "actividad-notificaciones" },
  // Genérico: debe ir al final para no tapar los /admin/configuracion/* de arriba.
  { prefix: "/admin/configuracion", key: "config-general" },
];

/** Busca el match de prefijo más específico (más largo) para un pathname. */
export function findModuleKeyForPath(pathname: string): string | null {
  let best: { prefix: string; key: string } | null = null;
  for (const entry of ROUTE_MODULE_MAP) {
    if (pathname === entry.prefix || pathname.startsWith(entry.prefix + "/")) {
      if (!best || entry.prefix.length > best.prefix.length) best = entry;
    }
  }
  return best?.key ?? null;
}
