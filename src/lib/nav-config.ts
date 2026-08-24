import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  CalendarDays,
  FileSignature,
  Share2,
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
} from "lucide-react";
import type { UserRole } from "@/types/database";

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
    { label: "Clientes", href: "/admin/clientes", icon: Users },
    { label: "Equipo", href: "/admin/equipo", icon: UserCog },
    { label: "Calendario", href: "/admin/calendario", icon: CalendarDays },
    { label: "Contratos", href: "/admin/contratos", icon: FileSignature },
    { label: "Redes sociales", href: "/admin/redes", icon: Share2 },
    { label: "Chat", href: "/admin/chat", icon: Inbox },
    {
      label: "Comercial",
      icon: Wallet,
      children: [
        { label: "Planes y facturación", href: "/admin/planes", icon: Wallet },
        { label: "CRM", href: "/admin/crm", icon: Handshake },
      ],
    },
    { label: "Reportes con IA", href: "/admin/reportes", icon: FileText },
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

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  editor: "Editor",
  client: "Cliente",
};
