import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Briefcase,
  UserCog,
  CalendarDays,
  FileSignature,
  Inbox,
  Wallet,
  FolderOpen,
  Settings,
  Sparkles,
  FileText,
  Handshake,
  Palette,
  Puzzle,
  KeyRound,
  BarChart3,
  Radar,
  Compass,
  AlertTriangle,
  Send,
  Link2,
  ListChecks,
  FolderKanban,
  Users,
  Image as ImageIcon,
  BookOpen,
  ClipboardList,
  Activity,
  Share2,
  Sparkle,
  Swords,
  LayoutGrid,
  History,
  Globe,
} from "lucide-react";
import type { ModuleFlag, UserRole } from "@/types/database";
import { findModuleKeyForPath } from "@/lib/module-route-map";
import { isModuleVisible } from "@/lib/module-visibility";

export interface NavItem {
  label: string;
  /**
   * Clave de `src/lib/i18n/dictionary.ts` (ej. "nav.analytics.overview").
   * `SidebarNav` la resuelve con `t(item.key, item.label)` — si falta la
   * clave o la traducción, `label` (el literal en español) es el fallback,
   * así un ítem nunca queda en blanco por una clave que todavía no se sumó.
   */
  key?: string;
  /** Ausente cuando el ítem es solo un grupo colapsable (ver `children`). */
  href?: string;
  icon: LucideIcon;
  /**
   * Sub-ítems del acordeón. Si están presentes, el ítem se renderiza como un
   * grupo colapsable (estilo MB Suite) en vez de un link directo — ver
   * `SidebarNav` en components/shared/app-shell.tsx.
   */
  children?: { label: string; key?: string; href: string; icon: LucideIcon }[];
}

/**
 * Ítems de navegación por rol. El layout de cada rol arma el sidebar desde acá.
 *
 * Dos duplicados que había antes quedaron resueltos acá (ver el mapa del
 * Admin que armamos): `/admin/redes` colgaba a la vez de Analytics
 * ("Monitors") y Social Media ("Insights") — la página es "Redes sociales:
 * cuentas conectadas y métricas clave" (`app/admin/redes/page.tsx`), así que
 * es 100% Social Media y "Monitors" se sacó de Analytics. Y "Bóveda" colgaba
 * a la vez de Management y Configuración — es config técnica (credenciales
 * cifradas), así que se sacó de Management y queda solo en Configuración.
 */
export const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", key: "nav.dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Cuentas", key: "nav.cuentas", href: "/admin/clientes", icon: Briefcase },
    {
      label: "Analytics",
      key: "nav.analytics.group",
      icon: BarChart3,
      children: [
        { label: "Overview", key: "nav.analytics.overview", href: "/admin/analytics", icon: BarChart3 },
        { label: "Dashboards", key: "nav.analytics.dashboards", href: "/admin/analytics/dashboards", icon: LayoutDashboard },
        { label: "Explorer", key: "nav.analytics.explorer", href: "/admin/analytics/explorer", icon: Compass },
        { label: "Reports", key: "nav.analytics.reports", href: "/admin/reportes", icon: FileText },
        { label: "Alertas", key: "nav.analytics.alertas", href: "/admin/analytics/alertas", icon: AlertTriangle },
        { label: "Envíos", key: "nav.analytics.envios", href: "/admin/analytics/envios", icon: Send },
        { label: "UTM Builder", key: "nav.analytics.utmBuilder", href: "/admin/analytics/utm-builder", icon: Link2 },
      ],
    },
    {
      label: "Management",
      key: "nav.management.group",
      icon: ListChecks,
      children: [
        { label: "Tareas", key: "nav.management.tareas", href: "/admin/tareas", icon: ListChecks },
        { label: "Proyectos", key: "nav.management.proyectos", href: "/admin/proyectos", icon: FolderKanban },
        { label: "Sitios Web", key: "nav.management.sitiosWeb", href: "/admin/sitios-web", icon: Globe },
        { label: "Contactos", key: "nav.management.contactos", href: "/admin/contactos", icon: Users },
        { label: "Media Library", key: "nav.management.mediaLibrary", href: "/admin/media-library", icon: ImageIcon },
        { label: "Knowledge Base", key: "nav.management.knowledgeBase", href: "/admin/knowledge-base", icon: BookOpen },
        { label: "Web Forms", key: "nav.management.webForms", href: "/admin/web-forms", icon: ClipboardList },
        { label: "Actividad", key: "nav.management.actividad", href: "/admin/actividad", icon: Activity },
      ],
    },
    {
      label: "Social Media",
      key: "nav.socialMedia.group",
      icon: Share2,
      children: [
        { label: "Overview", key: "nav.socialMedia.overview", href: "/admin/social-media", icon: Share2 },
        { label: "Insights", key: "nav.socialMedia.insights", href: "/admin/redes", icon: Radar },
        { label: "Planner", key: "nav.socialMedia.planner", href: "/admin/social-media/planner", icon: Compass },
        { label: "Content Studio", key: "nav.socialMedia.contentStudio", href: "/admin/social-media/content-studio", icon: Sparkle },
        { label: "Brand Voice", key: "nav.socialMedia.brandVoice", href: "/admin/social-media/brand-voice", icon: LayoutGrid },
        { label: "Competidores", key: "nav.socialMedia.competidores", href: "/admin/social-media/competidores", icon: Swords },
      ],
    },
    { label: "Equipo", key: "nav.equipo", href: "/admin/equipo", icon: UserCog },
    { label: "Calendario", key: "nav.calendario", href: "/admin/calendario", icon: CalendarDays },
    { label: "Contratos", key: "nav.contratos", href: "/admin/contratos", icon: FileSignature },
    { label: "Chat", key: "nav.chat", href: "/admin/chat", icon: Inbox },
    {
      label: "Comercial",
      key: "nav.comercial.group",
      icon: Wallet,
      children: [
        { label: "Planes y facturación", key: "nav.comercial.planes", href: "/admin/planes", icon: Wallet },
        { label: "CRM", key: "nav.comercial.crm", href: "/admin/crm", icon: Handshake },
      ],
    },
    { label: "Asistente IA", key: "nav.asistenteIA", href: "/admin/asistente", icon: Sparkles },
    {
      label: "Configuración",
      key: "nav.config.group",
      icon: Settings,
      children: [
        { label: "General", key: "nav.config.general", href: "/admin/configuracion", icon: Settings },
        { label: "Módulos", key: "nav.config.modulos", href: "/admin/configuracion/modulos", icon: Puzzle },
        { label: "Marca", key: "nav.config.marca", href: "/admin/configuracion/marca", icon: Palette },
        { label: "Bóveda", key: "nav.config.boveda", href: "/admin/configuracion/boveda", icon: KeyRound },
        { label: "Auditoría", key: "nav.config.auditoria", href: "/admin/configuracion/auditoria", icon: History },
      ],
    },
  ],
  editor: [
    { label: "Dashboard", key: "nav.dashboard", href: "/editor", icon: LayoutDashboard },
    { label: "Mis tareas", key: "nav.editor.misTareas", href: "/editor/tareas", icon: ListChecks },
    { label: "Calendario", key: "nav.calendario", href: "/editor/calendario", icon: CalendarDays },
    { label: "Drive de clientes", key: "nav.editor.driveClientes", href: "/editor/drive", icon: FolderOpen },
    { label: "Chat", key: "nav.chat", href: "/editor/chat", icon: Inbox },
  ],
  client: [
    { label: "Dashboard", key: "nav.dashboard", href: "/client", icon: LayoutDashboard },
    { label: "Calendario", key: "nav.calendario", href: "/client/calendario", icon: CalendarDays },
    { label: "Archivos", key: "nav.client.archivos", href: "/client/drive", icon: FolderOpen },
    { label: "Contratos", key: "nav.contratos", href: "/client/contratos", icon: FileSignature },
    { label: "Reportes", key: "nav.client.reportes", href: "/client/reportes", icon: FileText },
    { label: "Facturación", key: "nav.client.facturas", href: "/client/facturas", icon: Wallet },
    { label: "Mi sitio web", key: "nav.client.sitioWeb", href: "/client/sitio-web", icon: Globe },
    { label: "Chat", key: "nav.chat", href: "/client/chat", icon: Inbox },
  ],
};

/**
 * Filtra NAV_CONFIG según module_flags — usado por SidebarNav (app-shell.tsx).
 * Un ítem con children se oculta entero si TODOS sus hijos quedan ocultos.
 * Lo que no matchea ningún módulo del catálogo (ej. Dashboard) siempre queda.
 */
export function filterNavItems(
  items: NavItem[],
  role: UserRole,
  flags: Record<string, ModuleFlag>
): NavItem[] {
  // El propio panel de Módulos nunca se oculta al admin: si no, apagarlo por
  // error también borraría la única forma de volver a encontrarlo y prenderlo.
  const isModulesPanelForAdmin = (href: string) =>
    role === "admin" && findModuleKeyForPath(href) === "config-modulos";

  const result: NavItem[] = [];
  for (const item of items) {
    if (item.children) {
      const children = item.children.filter(
        (child) =>
          isModulesPanelForAdmin(child.href) ||
          isModuleVisible(flags[findModuleKeyForPath(child.href) ?? ""], role)
      );
      if (children.length > 0) result.push({ ...item, children });
      continue;
    }
    if (
      item.href &&
      !isModulesPanelForAdmin(item.href) &&
      !isModuleVisible(flags[findModuleKeyForPath(item.href) ?? ""], role)
    ) {
      continue;
    }
    result.push(item);
  }
  return result;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  editor: "Editor",
  client: "Cliente",
};
