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
    },
    editor: {
      driveClientes: "Drive de clientes",
      misTareas: "Mis tareas",
    },
    client: {
      archivos: "Archivos",
      reportes: "Reportes",
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
    monthlyChartTitle: "Facturación mensual",
    methodChartTitle: "Método de pago",
    kpiCurrentMonth: "Facturado este mes",
    kpiCollectionRate: "Tasa de cobro del mes",
    kpiPending: "Monto pendiente",
    kpiOverdue: "Monto atrasado",
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
    },
    editor: {
      driveClientes: "Client Drive",
      misTareas: "My Tasks",
    },
    client: {
      archivos: "Files",
      reportes: "Reports",
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
    monthlyChartTitle: "Monthly billing",
    methodChartTitle: "Payment method",
    kpiCurrentMonth: "Billed this month",
    kpiCollectionRate: "This month's collection rate",
    kpiPending: "Pending amount",
    kpiOverdue: "Overdue amount",
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
