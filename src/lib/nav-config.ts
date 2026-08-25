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
} from "lucide-react";
import type { ModuleFlag, UserRole } from "@/types/database";
import { findModuleKeyForPath } from "@/lib/module-route-map";
import { isModuleVisible } from "@/lib/module-visibility";

export interface NavItem {
  label: string;
  /** Ausente cuando el ítem es solo un grupo colapsable (ver `children`). */
  href?: string;
  icon: LucideIcon;
  /**
   * Sub-ítems del acordeón. Si están presentes, el ítem se renderiza como un
   * grupo colapsable (estilo MB Suite) en vez de un link directo — ver
   * `SidebarNav` en components/shared/app-shell.tsx.
   */
  children?: { label: string; href: string; icon: LucideIcon }[];
}

/** Ítems de navegación por rol. El layout de cada rol arma el sidebar desde acá. */
export const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Cuentas", href: "/admin/clientes", icon: Briefcase },
    {
      label: "Analytics",
      icon: BarChart3,
      children: [
        { label: "Overview", href: "/admin/analytics", icon: BarChart3 },
        { label: "Monitors", href: "/admin/redes", icon: Radar },
        { label: "Dashboards", href: "/admin/analytics/dashboards", icon: LayoutDashboard },
        { label: "Explorer", href: "/admin/analytics/explorer", icon: Compass },
        { label: "Reports", href: "/admin/reportes", icon: FileText },
        { label: "Alertas", href: "/admin/analytics/alertas", icon: AlertTriangle },
        { label: "Envíos", href: "/admin/analytics/envios", icon: Send },
        { label: "UTM Builder", href: "/admin/analytics/utm-builder", icon: Link2 },
      ],
    },
    {
      label: "Management",
      icon: ListChecks,
      children: [
        { label: "Tareas", href: "/admin/tareas", icon: ListChecks },
        { label: "Proyectos", href: "/admin/proyectos", icon: FolderKanban },
        { label: "Contactos", href: "/admin/contactos", icon: Users },
        { label: "Media Library", href: "/admin/media-library", icon: ImageIcon },
        { label: "Knowledge Base", href: "/admin/knowledge-base", icon: BookOpen },
        { label: "Web Forms", href: "/admin/web-forms", icon: ClipboardList },
        { label: "Bóveda", href: "/admin/configuracion/boveda", icon: KeyRound },
        { label: "Actividad", href: "/admin/actividad", icon: Activity },
      ],
    },
    {
      label: "Social Media",
      icon: Share2,
      children: [
        { label: "Overview", href: "/admin/social-media", icon: Share2 },
        { label: "Insights", href: "/admin/redes", icon: Radar },
        { label: "Planner", href: "/admin/social-media/planner", icon: Compass },
        { label: "Content Studio", href: "/admin/social-media/content-studio", icon: Sparkle },
        { label: "Brand Voice", href: "/admin/social-media/brand-voice", icon: LayoutGrid },
        { label: "Competidores", href: "/admin/social-media/competidores", icon: Swords },
      ],
    },
    { label: "Equipo", href: "/admin/equipo", icon: UserCog },
    { label: "Calendario", href: "/admin/calendario", icon: CalendarDays },
    { label: "Contratos", href: "/admin/contratos", icon: FileSignature },
    { label: "Chat", href: "/admin/chat", icon: Inbox },
    {
      label: "Comercial",
      icon: Wallet,
      children: [
        { label: "Planes y facturación", href: "/admin/planes", icon: Wallet },
        { label: "CRM", href: "/admin/crm", icon: Handshake },
      ],
    },
    { label: "Asistente IA", href: "/admin/asistente", icon: Sparkles },
    {
      label: "Configuración",
      icon: Settings,
      children: [
        { label: "General", href: "/admin/configuracion", icon: Settings },
        { label: "Módulos", href: "/admin/configuracion/modulos", icon: Puzzle },
        { label: "Marca", href: "/admin/configuracion/marca", icon: Palette },
        { label: "Bóveda", href: "/admin/configuracion/boveda", icon: KeyRound },
      ],
    },
  ],
  editor: [
    { label: "Dashboard", href: "/editor", icon: LayoutDashboard },
    { label: "Calendario", href: "/editor/calendario", icon: CalendarDays },
    { label: "Drive de clientes", href: "/editor/drive", icon: FolderOpen },
    { label: "Chat", href: "/editor/chat", icon: Inbox },
  ],
  client: [
    { label: "Dashboard", href: "/client", icon: LayoutDashboard },
    { label: "Calendario", href: "/client/calendario", icon: CalendarDays },
    { label: "Archivos", href: "/client/drive", icon: FolderOpen },
    { label: "Contratos", href: "/client/contratos", icon: FileSignature },
    { label: "Reportes", href: "/client/reportes", icon: FileText },
    { label: "Chat", href: "/client/chat", icon: Inbox },
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
