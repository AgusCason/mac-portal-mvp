/**
 * Catálogo de módulos de MAC Portal — Fase 2.4 de la adaptación "estilo MB
 * Suite" (equivalente a Configuración > Módulos: una sola pantalla que lista
 * todo el producto por categoría, con su estado y sus dependencias). Hoy es
 * solo informativo — el `status` no gatea todavía nada en el sidebar ni en
 * las rutas; es la base para, más adelante, activar/desactivar módulos por
 * organización sin tener que tocar código cada vez.
 */
export type ModuleStatus = "incluido" | "proximamente";
export type ModuleArea = "Marketing & Analytics" | "Gestión" | "Plataforma";

type TFunc = (path: string, fallback?: string) => string;

export interface ModuleEntry {
  key: string;
  label: string;
  description: string;
  status: ModuleStatus;
  /** Key del módulo del que depende (ver MODULES_CATALOG), no el label — así queda traducible. */
  dependsOn?: string;
}

export interface ModuleCategory {
  area: ModuleArea;
  category: string;
  modules: ModuleEntry[];
}

export const MODULES_CATALOG: ModuleCategory[] = [
  {
    area: "Marketing & Analytics",
    category: "Contenido",
    modules: [
      {
        key: "calendario",
        label: "Calendario editorial",
        description:
          "Kanban de piezas de contenido (Borrador → Publicado), con arrastrar y soltar y flujo de aprobación del cliente.",
        status: "incluido",
      },
      {
        key: "redes-sociales",
        label: "Redes sociales",
        description: "Cuentas conectadas y métricas clave por cliente (Meta, TikTok, YouTube).",
        status: "incluido",
      },
      {
        key: "redes-insights",
        label: "Redes — Insights",
        description: "Panel de insights de redes sociales dentro de Social Media (cuentas y métricas clave).",
        status: "incluido",
        dependsOn: "redes-sociales",
      },
    ],
  },
  {
    area: "Marketing & Analytics",
    category: "Analytics",
    modules: [
      {
        key: "analytics-overview",
        label: "Analytics Overview",
        description: "Resumen general de métricas de campañas y contenido.",
        status: "incluido",
      },
      {
        key: "analytics-dashboards",
        label: "Analytics Dashboards",
        description: "Dashboards armables con los widgets de métricas de la agencia.",
        status: "incluido",
      },
      {
        key: "analytics-explorer",
        label: "Analytics Explorer",
        description: "Exploración libre de métricas y segmentos.",
        status: "incluido",
      },
      {
        key: "analytics-envios",
        label: "Analytics Envíos",
        description: "Envíos programados de reportes y dashboards por email.",
        status: "incluido",
      },
      {
        key: "analytics-utm-builder",
        label: "UTM Builder",
        description: "Generador de links con parámetros UTM para campañas.",
        status: "incluido",
      },
    ],
  },
  {
    area: "Marketing & Analytics",
    category: "Reportes",
    modules: [
      {
        key: "reportes-ia",
        label: "Reportes con IA",
        description:
          "Resumen ejecutivo redactado por Nova a partir de contenido publicado y métricas reales, con estado, período y plataformas.",
        status: "incluido",
      },
      {
        key: "alertas-metricas",
        label: "Alertas de métricas",
        description: "Aviso automático cuando una métrica de redes cae por debajo de lo esperado.",
        status: "incluido",
        dependsOn: "redes-sociales",
      },
    ],
  },
  {
    area: "Gestión",
    category: "Cuentas",
    modules: [
      {
        key: "cuentas",
        label: "Cuentas",
        description: "Alta, ficha y mini-workspace por cuenta (contenido, reportes, contratos, facturación).",
        status: "incluido",
      },
      {
        key: "equipo",
        label: "Equipo",
        description: "Editores de la agencia y su asignación a clientes.",
        status: "incluido",
      },
      {
        key: "contratos",
        label: "Contratos",
        description: "Documentos legales con firma digital y trazabilidad (IP + fecha).",
        status: "incluido",
      },
      {
        key: "drive",
        label: "Drive de clientes",
        description: "Carpetas de Google Drive generadas automáticamente por cliente.",
        status: "incluido",
      },
      {
        key: "chat",
        label: "Chat",
        description: "Mensajería centralizada por cliente, integrada con WhatsApp.",
        status: "incluido",
      },
    ],
  },
  {
    area: "Gestión",
    category: "Operación",
    modules: [
      {
        key: "tareas",
        label: "Tareas",
        description: "Tareas del workspace, asignables a editores — panel del admin y \"Mis tareas\" del editor.",
        status: "incluido",
      },
      {
        key: "proyectos",
        label: "Proyectos",
        description: "Seguimiento de proyectos por cliente, con hitos y estado.",
        status: "incluido",
      },
      {
        key: "sitios-web",
        label: "Diseño y Desarrollo Web",
        description:
          "Proyectos de sitios web por cliente, con etapas (Brief → Lanzamiento), datos técnicos y aprobación de entregables por el cliente.",
        status: "incluido",
      },
      {
        key: "contactos",
        label: "Contactos",
        description: "Libreta de contactos de clientes y prospectos.",
        status: "incluido",
      },
      {
        key: "media-library",
        label: "Media Library",
        description: "Biblioteca de archivos multimedia reutilizables entre clientes.",
        status: "incluido",
      },
      {
        key: "knowledge-base",
        label: "Knowledge Base",
        description: "Artículos internos de referencia para el equipo.",
        status: "incluido",
      },
      {
        key: "web-forms",
        label: "Web Forms",
        description: "Formularios web embebibles y sus respuestas.",
        status: "incluido",
      },
    ],
  },
  {
    area: "Gestión",
    category: "Comercial",
    modules: [
      {
        key: "planes-facturacion",
        label: "Planes y facturación",
        description: "Planes contratados, facturas, morosidad y recordatorios automáticos.",
        status: "incluido",
      },
      {
        key: "crm",
        label: "CRM",
        description: "Pipeline liviano de prospectos y oportunidades comerciales de la agencia.",
        status: "incluido",
      },
    ],
  },
  {
    area: "Plataforma",
    category: "Inteligencia Artificial",
    modules: [
      {
        key: "asistente-ia",
        label: "Asistente IA",
        description: "MAX: copiloto que responde sobre la operación y propone cambios (siempre con confirmación humana).",
        status: "incluido",
      },
    ],
  },
  {
    area: "Plataforma",
    category: "Configuración",
    modules: [
      {
        key: "config-general",
        label: "General",
        description: "Datos de la agencia e integraciones (Drive, WhatsApp, Meta Ads).",
        status: "incluido",
      },
      {
        key: "config-modulos",
        label: "Módulos",
        description: "Esta pantalla — el índice maestro de todo lo que tiene MAC Portal.",
        status: "incluido",
      },
      {
        key: "config-marca",
        label: "Marca",
        description: "Nombre, logos, colores y tipografías white-label de la plataforma.",
        status: "incluido",
      },
      {
        key: "config-boveda",
        label: "Bóveda",
        description: "Credenciales y accesos técnicos cifrados, con vínculo opcional a un cliente.",
        status: "incluido",
      },
      {
        key: "config-auditoria",
        label: "Auditoría",
        description:
          "Registro de quién marcó facturas como pagadas, editó métodos de cobro o tocó una credencial de la Bóveda.",
        status: "incluido",
      },
      {
        key: "verificacion-2fa",
        label: "Verificación en dos pasos (2FA)",
        description:
          "Apagado por defecto — a propósito. Al prenderlo, cualquier usuario puede activarlo para su propia cuenta desde Mi Perfil > Seguridad, con una app de autenticación (Google Authenticator, Authy, etc.): sin el código de esa app, ni sabiendo la contraseña se puede entrar. Manual rápido antes de prenderlo: (1) hoy no hay códigos de respaldo — si alguien pierde el dispositivo con la app, no hay forma de recuperar el acceso solo; (2) tampoco hay un botón para que un admin le resetee el 2FA a otro usuario trabado — la única salida hoy es recuperar el dispositivo o darlo de baja y crear el usuario de nuevo. Prendelo recién cuando el equipo esté al tanto de esto.",
        status: "incluido",
      },
      {
        key: "actividad-notificaciones",
        label: "Actividad y Notificaciones",
        description: "Bitácora del workspace y avisos personales, en paneles deslizantes desde cualquier pantalla.",
        status: "incluido",
      },
      {
        key: "portal-clientes",
        label: "Portal de Clientes",
        description: "Vista de solo el cliente final: sus contenidos, reportes, contratos y facturación.",
        status: "incluido",
      },
    ],
  },
];

export function countModulesByStatus(status: ModuleStatus): number {
  return MODULES_CATALOG.reduce(
    (sum, cat) => sum + cat.modules.filter((m) => m.status === status).length,
    0
  );
}

export function totalModulesCount(): number {
  return MODULES_CATALOG.reduce((sum, cat) => sum + cat.modules.length, 0);
}

/** Busca un módulo por su `key` en todo el catálogo (usado para resolver `dependsOn`). */
export function findModuleByKey(key: string): ModuleEntry | undefined {
  return MODULES_CATALOG.flatMap((cat) => cat.modules).find((m) => m.key === key);
}

const AREA_KEY: Record<ModuleArea, string> = {
  "Marketing & Analytics": "marketingAnalytics",
  Gestión: "gestion",
  Plataforma: "plataforma",
};

const CATEGORY_KEY: Record<string, string> = {
  Contenido: "contenido",
  Analytics: "analytics",
  Reportes: "reportes",
  Cuentas: "cuentas",
  Operación: "operacion",
  Comercial: "comercial",
  "Inteligencia Artificial": "ia",
  Configuración: "configuracion",
};

export function getModuleLabel(mod: ModuleEntry, t?: TFunc): string {
  return t ? t(`catalog.modules.${mod.key}.label`, mod.label) : mod.label;
}

export function getModuleDescription(mod: ModuleEntry, t?: TFunc): string {
  return t ? t(`catalog.modules.${mod.key}.description`, mod.description) : mod.description;
}

export function getModuleAreaLabel(area: ModuleArea, t?: TFunc): string {
  const slug = AREA_KEY[area];
  return t ? t(`catalog.areas.${slug}`, area) : area;
}

export function getModuleCategoryLabel(category: string, t?: TFunc): string {
  const slug = CATEGORY_KEY[category];
  return slug && t ? t(`catalog.categories.${slug}`, category) : category;
}
