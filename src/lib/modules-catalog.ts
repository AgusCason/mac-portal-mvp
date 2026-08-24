/**
 * Catálogo de módulos de MAC Portal — Fase 2.4 de la adaptación "estilo MB
 * Suite" (equivalente a Configuración > Módulos: una sola pantalla que lista
 * todo el producto por categoría, con su estado y sus dependencias). Hoy es
 * solo informativo — el `status` no gatea todavía nada en el sidebar ni en
 * las rutas; es la base para, más adelante, activar/desactivar módulos por
 * organización sin tener que tocar código cada vez.
 */
export type ModuleStatus = "incluido" | "proximamente";

export interface ModuleEntry {
  key: string;
  label: string;
  description: string;
  status: ModuleStatus;
  dependsOn?: string;
}

export interface ModuleCategory {
  area: "Marketing & Analytics" | "Gestión" | "Plataforma";
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
        dependsOn: "Redes sociales",
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
