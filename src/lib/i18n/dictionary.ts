/**
 * Diccionario de idiomas — español (Argentina, predeterminado) / inglés.
 *
 * Arquitectura liviana a propósito: sin librería de i18n ni rutas por
 * locale (`/en/admin`), porque lo que se pidió es un selector de idioma
 * por usuario, no URLs localizadas ni SEO multi-idioma. La fuente de
 * verdad es `profiles.language` (ya existía en el schema — ver
 * `0019_profile_details.sql` — pero hasta ahora no cambiaba nada
 * renderizado). `resolveLocale()` mapea ese valor (incluye `pt`, que no
 * está en el alcance pedido) a `Locale`, cayendo siempre a español.
 *
 * Cobertura de esta primera pasada: navegación (los 3 roles), el panel de
 * Preferencias (Settings), y los títulos/tabs de Facturación y Tareas —
 * lo que se tocó en esta actualización. El resto de las pantallas se va
 * sumando acá en próximas actualizaciones; mientras tanto siguen en
 * español sin importar el idioma elegido (no quedan a medio traducir).
 */

export type Locale = "es" | "en";

const es = {
  nav: {
    dashboard: "Dashboard",
    cuentas: "Cuentas",
    equipo: "Equipo",
    calendario: "Calendario",
    contratos: "Contratos",
    chat: "Chat",
    asistenteIA: "Asistente IA",
    analytics: {
      group: "Analytics",
      overview: "Overview",
      dashboards: "Dashboards",
      explorer: "Explorer",
      reports: "Reports",
      alertas: "Alertas",
      envios: "Envíos",
      utmBuilder: "UTM Builder",
    },
    socialMedia: {
      group: "Social Media",
      overview: "Overview",
      insights: "Insights",
      planner: "Planner",
      contentStudio: "Content Studio",
      brandVoice: "Brand Voice",
      competidores: "Competidores",
    },
    management: {
      group: "Management",
      tareas: "Tareas",
      proyectos: "Proyectos",
      contactos: "Contactos",
      mediaLibrary: "Media Library",
      knowledgeBase: "Knowledge Base",
      webForms: "Web Forms",
      actividad: "Actividad",
    },
    comercial: {
      group: "Comercial",
      planes: "Planes y facturación",
      crm: "CRM",
    },
    config: {
      group: "Configuración",
      general: "General",
      modulos: "Módulos",
      marca: "Marca",
      boveda: "Bóveda",
      auditoria: "Auditoría",
    },
    editor: {
      driveClientes: "Drive de clientes",
      misTareas: "Mis tareas",
    },
    client: {
      archivos: "Archivos",
      reportes: "Reportes",
      facturas: "Facturación",
    },
  },
  common: {
    save: "Guardar",
    cancel: "Cancelar",
    viewTable: "Ver tabla",
    viewChart: "Ver gráfico",
    loading: "Cargando…",
    myProfile: "Mi Perfil",
    logout: "Cerrar sesión",
  },
  settings: {
    title: "Preferencias",
    description: "Personalizá tu experiencia en la plataforma.",
    theme: "Tema",
    language: "Idioma",
    themeOptions: {
      light: { label: "Claro", tagline: "Simple y luminoso" },
      dark: { label: "Oscuro", tagline: "Cómodo para trabajar de noche" },
      system: { label: "Sistema", tagline: "Sigue la configuración de tu dispositivo" },
    },
    languageOptions: {
      es: { label: "Español (Argentina)", tagline: "Predeterminado" },
      en: { label: "English", tagline: "Switches menus and titles to English" },
    },
  },
  billing: {
    pageTitle: "Planes y facturación",
    pageDescription: "Información financiera — visible solo para vos (RLS bloquea a editores).",
    tabDashboard: "Dashboard",
    tabFacturacion: "Facturación",
    tabPlanes: "Planes",
    tabCobro: "Métodos de cobro",
    monthlyChartTitle: "Facturación mensual",
    methodChartTitle: "Método de pago",
    kpiCurrentMonth: "Facturado este mes",
    kpiCollectionRate: "Tasa de cobro del mes",
    kpiPending: "Monto pendiente",
    kpiOverdue: "Monto atrasado",
    clientPageTitle: "Facturación",
    clientPageDescription: "Tus facturas y cómo pagarlas.",
    noInvoices: "Todavía no tenés facturas.",
    payNow: "Pagar",
    payDialogTitle: "Pagar factura",
    payDialogDescription: "Elegí cómo pagar — el pago se acredita afuera de la plataforma.",
    bankTransfer: "Transferencia bancaria",
    copy: "Copiar",
    copied: "Copiado",
    iPaid: "Ya pagué / transferí",
    iPaidSuccess: "Listo, le avisamos al admin.",
  },
  tasks: {
    adminPageTitle: "Tareas del Workspace",
    adminPageDescription: "Gestiona y asigna tareas para la agencia.",
    editorPageTitle: "Mis tareas",
    editorPageDescription: "Tareas que te asignó el admin.",
    newTask: "Nueva tarea",
    noTasks: "No tenés tareas asignadas por ahora.",
    statusPendiente: "Pendiente",
    statusEnCurso: "En curso",
    statusCompletada: "Completada",
    statusCancelada: "Cancelada",
  },
  audit: {
    pageTitle: "Auditoría",
    pageDescription:
      "Registro de acciones financieras y sensibles — quién marcó qué como pagado, quién editó los métodos de cobro, quién tocó una credencial de la Bóveda.",
  },
  pages: {
    calendario: { title: "Calendario editorial" },
    configuracion: { title: "Configuración" },
    redes: {
      title: "Redes sociales",
      badge: "Fase avanzada",
      noAccounts: "Todavía no conectaste ninguna cuenta",
      reach: "Alcance",
      engagement: "Engagement",
      followers: "Seguidores",
      plays: "Reproducciones",
    },
    equipo: {
      noName: "Sin nombre",
      noClients: "Sin clientes asignados",
    },
    clienteDetail: {
      noBrandName: "Sin nombre de marca",
      statusActive: "Activo",
      statusPaused: "Pausado",
      statusLost: "Perdido",
      kpiContent: "Piezas de contenido",
      kpiContracts: "Contratos",
      kpiDriveFolders: "Carpetas en Drive",
      tabSummary: "Resumen",
      tabContent: "Contenido",
      tabReports: "Reportes",
      tabContracts: "Contratos",
      tabBilling: "Facturación",
      assignedEditors: "Editores asignados",
      noEditors: "Sin editores asignados todavía.",
      portalUser: "Usuario del portal cliente",
      portalUserHint: "Vinculá acá la cuenta con la que este cliente va a loguearse a ver su portal.",
      drive: "Google Drive",
      driveNotCreated:
        "Las carpetas de Drive todavía no se crearon (revisá las credenciales de la Service Account en .env.local).",
    },
    proyectos: {
      internal: "Proyecto interno",
      account: "Cuenta",
    },
    actividad: {
      contentCreated: "Nueva pieza",
      contentStatusChanged: "Cambio de estado",
      reportPublished: "Reporte publicado",
      contractSigned: "Contrato firmado",
      invoicePaid: "Pago registrado",
      clientCreated: "Cliente nuevo",
    },
    analyticsEnvios: {
      empty: "Todavía no se publicó ningún reporte",
      client: "Cliente",
      report: "Reporte",
      period: "Período",
      platforms: "Plataformas",
    },
    analyticsExplorer: {
      date: "Fecha",
      account: "Cuenta",
      platform: "Plataforma",
      reach: "Alcance",
      impressions: "Impresiones",
      engagement: "Engagement",
    },
    analyticsAlertas: {
      title: "Alertas de métricas",
      empty: "Sin caídas detectadas por ahora",
      account: "Cuenta",
      metric: "Métrica",
      previousAvg: "Promedio previo",
      value: "Valor",
    },
    analyticsDashboards: {
      empty: "Todavía no hay cuentas conectadas",
      reach: "Alcance",
      followers: "Seguidores",
      engagement: "Engagement",
    },
    analyticsOverview: {
      title: "Analytics",
      description: "Rendimiento agregado de todas las cuentas conectadas de la agencia.",
      connectedAccounts: "Cuentas conectadas",
      totalReach: "Alcance total",
      totalFollowers: "Seguidores totales",
      avgEngagement: "Engagement promedio",
      metricAlerts: "Alertas de métricas",
      viewAll: "Ver todas",
      reportsThisMonth: "Reportes este mes",
      goToReports: "Ir a Reports",
      tools: "Herramientas",
      shortcutMonitorsDesc: "Cuentas sociales conectadas y su última métrica cargada.",
      shortcutDashboardsDesc: "Vistas armadas por tema: alcance, engagement, crecimiento.",
      shortcutExplorerDesc: "Tabla plana y filtrable de todas las métricas cargadas.",
      shortcutReportsDesc: "Reportes con IA por cliente, borrador o publicados.",
      shortcutAlertasDesc: "Caídas de métricas detectadas automáticamente.",
      shortcutEnviosDesc: "Historial de reportes publicados y enviados a clientes.",
      shortcutUtmDesc: "Arma URLs de campaña con parámetros UTM.",
    },
    socialOverview: {
      description: "Resumen de piezas, cuentas conectadas y próximas publicaciones.",
      totalPieces: "Piezas totales",
      connectedAccounts: "Cuentas conectadas",
      scheduled: "Programadas",
      upcoming: "Próximas publicaciones",
      noScheduled: "No hay piezas programadas.",
      byStatus: "Piezas por estado",
      noPieces: "Todavía no hay piezas cargadas.",
      shortcutInsightsDesc: "Métricas y monitoreo por cuenta",
      shortcutPlannerDesc: "Calendario y kanban de piezas",
      shortcutStudioDesc: "Banco de ideas, guiones y captions",
      shortcutBrandDesc: "Tono de marca por cuenta",
      shortcutCompetDesc: "Benchmark de la competencia",
    },
    editorCalendario: {
      tabList: "Lista por fecha límite",
      tabKanban: "Kanban",
    },
    clientDrive: { title: "Tus archivos" },
    clientChat: { title: "Chat con la agencia" },
    clientContratos: { title: "Tus contratos" },
    clientCalendario: { title: "Tu calendario editorial" },
  },
};

// El tipo de `en` se deriva de `es`: si falta una clave, TypeScript lo
// marca en rojo — evita que el inglés se desincronice en silencio.
const en: typeof es = {
  nav: {
    dashboard: "Dashboard",
    cuentas: "Accounts",
    equipo: "Team",
    calendario: "Calendar",
    contratos: "Contracts",
    chat: "Chat",
    asistenteIA: "AI Assistant",
    analytics: {
      group: "Analytics",
      overview: "Overview",
      dashboards: "Dashboards",
      explorer: "Explorer",
      reports: "Reports",
      alertas: "Alerts",
      envios: "Sends",
      utmBuilder: "UTM Builder",
    },
    socialMedia: {
      group: "Social Media",
      overview: "Overview",
      insights: "Insights",
      planner: "Planner",
      contentStudio: "Content Studio",
      brandVoice: "Brand Voice",
      competidores: "Competitors",
    },
    management: {
      group: "Management",
      tareas: "Tasks",
      proyectos: "Projects",
      contactos: "Contacts",
      mediaLibrary: "Media Library",
      knowledgeBase: "Knowledge Base",
      webForms: "Web Forms",
      actividad: "Activity",
    },
    comercial: {
      group: "Commercial",
      planes: "Plans & Billing",
      crm: "CRM",
    },
    config: {
      group: "Settings",
      general: "General",
      modulos: "Modules",
      marca: "Branding",
      boveda: "Vault",
      auditoria: "Audit Log",
    },
    editor: {
      driveClientes: "Client Drive",
      misTareas: "My Tasks",
    },
    client: {
      archivos: "Files",
      reportes: "Reports",
      facturas: "Billing",
    },
  },
  common: {
    save: "Save",
    cancel: "Cancel",
    viewTable: "View table",
    viewChart: "View chart",
    loading: "Loading…",
    myProfile: "My Profile",
    logout: "Log out",
  },
  settings: {
    title: "Preferences",
    description: "Customize your experience on the platform.",
    theme: "Theme",
    language: "Language",
    themeOptions: {
      light: { label: "Light", tagline: "Simple and bright" },
      dark: { label: "Dark", tagline: "Comfortable for working at night" },
      system: { label: "System", tagline: "Follows your device setting" },
    },
    languageOptions: {
      es: { label: "Español (Argentina)", tagline: "Default" },
      en: { label: "English", tagline: "Cambia menús y títulos a inglés" },
    },
  },
  billing: {
    pageTitle: "Plans & Billing",
    pageDescription: "Financial information — visible only to you (RLS blocks editors).",
    tabDashboard: "Dashboard",
    tabFacturacion: "Billing",
    tabPlanes: "Plans",
    tabCobro: "Payment Methods",
    monthlyChartTitle: "Monthly billing",
    methodChartTitle: "Payment method",
    kpiCurrentMonth: "Billed this month",
    kpiCollectionRate: "This month's collection rate",
    kpiPending: "Pending amount",
    kpiOverdue: "Overdue amount",
    clientPageTitle: "Billing",
    clientPageDescription: "Your invoices and how to pay them.",
    noInvoices: "You don't have any invoices yet.",
    payNow: "Pay",
    payDialogTitle: "Pay invoice",
    payDialogDescription: "Choose how to pay — payment settles outside the platform.",
    bankTransfer: "Bank transfer",
    copy: "Copy",
    copied: "Copied",
    iPaid: "I already paid / transferred",
    iPaidSuccess: "Done, we let the admin know.",
  },
  tasks: {
    adminPageTitle: "Workspace Tasks",
    adminPageDescription: "Manage and assign tasks for the agency.",
    editorPageTitle: "My Tasks",
    editorPageDescription: "Tasks your admin assigned to you.",
    newTask: "New task",
    noTasks: "You don't have any tasks assigned yet.",
    statusPendiente: "Pending",
    statusEnCurso: "In progress",
    statusCompletada: "Completed",
    statusCancelada: "Cancelled",
  },
  audit: {
    pageTitle: "Audit Log",
    pageDescription:
      "Financial and sensitive actions — who marked what as paid, who edited payment methods, who touched a Vault credential.",
  },
  pages: {
    calendario: { title: "Editorial Calendar" },
    configuracion: { title: "Settings" },
    redes: {
      title: "Social Accounts",
      badge: "Advanced stage",
      noAccounts: "You haven't connected any account yet",
      reach: "Reach",
      engagement: "Engagement",
      followers: "Followers",
      plays: "Plays",
    },
    equipo: {
      noName: "No name",
      noClients: "No clients assigned",
    },
    clienteDetail: {
      noBrandName: "No brand name",
      statusActive: "Active",
      statusPaused: "Paused",
      statusLost: "Lost",
      kpiContent: "Content pieces",
      kpiContracts: "Contracts",
      kpiDriveFolders: "Drive folders",
      tabSummary: "Summary",
      tabContent: "Content",
      tabReports: "Reports",
      tabContracts: "Contracts",
      tabBilling: "Billing",
      assignedEditors: "Assigned editors",
      noEditors: "No editors assigned yet.",
      portalUser: "Client portal user",
      portalUserHint: "Link the account this client will log in with to see their portal here.",
      drive: "Google Drive",
      driveNotCreated:
        "Drive folders haven't been created yet (check the Service Account credentials in .env.local).",
    },
    proyectos: {
      internal: "Internal project",
      account: "Account",
    },
    actividad: {
      contentCreated: "New content piece",
      contentStatusChanged: "Status change",
      reportPublished: "Report published",
      contractSigned: "Contract signed",
      invoicePaid: "Payment recorded",
      clientCreated: "New client",
    },
    analyticsEnvios: {
      empty: "No report has been published yet",
      client: "Client",
      report: "Report",
      period: "Period",
      platforms: "Platforms",
    },
    analyticsExplorer: {
      date: "Date",
      account: "Account",
      platform: "Platform",
      reach: "Reach",
      impressions: "Impressions",
      engagement: "Engagement",
    },
    analyticsAlertas: {
      title: "Metric Alerts",
      empty: "No drops detected for now",
      account: "Account",
      metric: "Metric",
      previousAvg: "Previous average",
      value: "Value",
    },
    analyticsDashboards: {
      empty: "No accounts connected yet",
      reach: "Reach",
      followers: "Followers",
      engagement: "Engagement",
    },
    analyticsOverview: {
      title: "Analytics",
      description: "Aggregated performance across all connected accounts of the agency.",
      connectedAccounts: "Connected accounts",
      totalReach: "Total reach",
      totalFollowers: "Total followers",
      avgEngagement: "Average engagement",
      metricAlerts: "Metric alerts",
      viewAll: "View all",
      reportsThisMonth: "Reports this month",
      goToReports: "Go to Reports",
      tools: "Tools",
      shortcutMonitorsDesc: "Connected social accounts and their latest loaded metric.",
      shortcutDashboardsDesc: "Views built by topic: reach, engagement, growth.",
      shortcutExplorerDesc: "Flat, filterable table of every loaded metric.",
      shortcutReportsDesc: "AI reports per client, draft or published.",
      shortcutAlertasDesc: "Metric drops detected automatically.",
      shortcutEnviosDesc: "History of reports published and sent to clients.",
      shortcutUtmDesc: "Build campaign URLs with UTM parameters.",
    },
    socialOverview: {
      description: "Summary of pieces, connected accounts, and upcoming publishes.",
      totalPieces: "Total pieces",
      connectedAccounts: "Connected accounts",
      scheduled: "Scheduled",
      upcoming: "Upcoming publishes",
      noScheduled: "No scheduled pieces.",
      byStatus: "Pieces by status",
      noPieces: "No pieces loaded yet.",
      shortcutInsightsDesc: "Metrics and monitoring per account",
      shortcutPlannerDesc: "Calendar and kanban of pieces",
      shortcutStudioDesc: "Idea bank, scripts, and captions",
      shortcutBrandDesc: "Brand tone per account",
      shortcutCompetDesc: "Competitor benchmark",
    },
    editorCalendario: {
      tabList: "List by due date",
      tabKanban: "Kanban",
    },
    clientDrive: { title: "Your Files" },
    clientChat: { title: "Chat with the agency" },
    clientContratos: { title: "Your Contracts" },
    clientCalendario: { title: "Your Editorial Calendar" },
  },
};

export const DICTIONARIES: Record<Locale, typeof es> = { es, en };

/** `profiles.language` incluye `pt` (fuera de alcance) — cae siempre a español. */
export function resolveLocale(language: string | null | undefined): Locale {
  return language === "en" ? "en" : "es";
}

/** Busca una clave con puntos (ej. "nav.analytics.overview") en el diccionario del locale. */
export function translate(locale: Locale, path: string, fallback?: string): string {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES.es;
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- recorrido genérico del árbol de traducciones
  let node: any = dict;
  for (const part of parts) {
    node = node?.[part];
    if (node === undefined || node === null) return fallback ?? path;
  }
  return typeof node === "string" ? node : (fallback ?? path);
}

/** Helper para Server Components: ya tienen `profile.language` de `requireRole()`, sin necesitar contexto. */
export function getT(language: string | null | undefined) {
  const locale = resolveLocale(language);
  return (path: string, fallback?: string) => translate(locale, path, fallback);
}
