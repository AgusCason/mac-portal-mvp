"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, ChevronDown, UserCircle } from "lucide-react";

import { NAV_CONFIG, ROLE_LABELS, filterNavItems, type NavItem } from "@/lib/nav-config";
import type { Profile, AgencyBranding, ModuleFlag } from "@/types/database";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogoutMenuItem } from "@/components/shared/logout-button";
import { ActivityPanel } from "@/components/shared/activity-panel";
import { NotificationsPanel } from "@/components/shared/notifications-panel";
import { SettingsPanel } from "@/components/shared/settings-panel";
import { MyProfileDialog } from "@/components/shared/my-profile-dialog";
import type { ActivityEventWithClient } from "@/lib/queries/activity";
import type { AppNotification } from "@/types/database";

interface AppShellProps {
  profile: Profile;
  children: React.ReactNode;
  activity: ActivityEventWithClient[];
  notifications: AppNotification[];
  unreadCount: number;
  branding: AgencyBranding;
  moduleFlags: Record<string, ModuleFlag>;
}

function isItemActive(pathname: string, href: string, role: string) {
  return pathname === href || (href !== `/${role}` && pathname.startsWith(`${href}/`));
}

/**
 * Entre los hijos de un mismo grupo, elige un único activo — el href más
 * específico (más largo) que matchea. Sin esto, un hijo "índice" cuyo href
 * es prefijo literal de sus hermanos (ej. "Overview" en `/admin/social-media`
 * vs. "Planner" en `/admin/social-media/planner`) queda marcado activo al
 * mismo tiempo que la sección en la que en realidad estás parado.
 */
function pickActiveChildHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      if (!best || href.length > best.length) best = href;
    }
  }
  return best;
}

/**
 * Un ítem simple (link directo). Se usa tanto para los ítems raíz sin
 * children como para los sub-ítems dentro de un grupo expandido.
 */
function NavLink({
  href,
  label,
  icon: Icon,
  active,
  indented,
}: {
  href: string;
  label: string;
  icon: LucideIconType;
  active: boolean;
  indented?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
        indented && "py-1.5 pl-9 text-[13px]",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("shrink-0", indented ? "size-3.5" : "size-4")} strokeWidth={1.75} />
      {label}
    </Link>
  );
}

type LucideIconType = NavItem["icon"];

/**
 * Grupo colapsable estilo "acordeón" de MB Suite: el header del grupo alterna
 * expandido/colapsado (no navega), y sus hijos se muestran indentados debajo.
 * Se auto-expande si la ruta activa pertenece a alguno de sus hijos.
 */
function NavGroup({
  item,
  pathname,
  open,
  onToggle,
}: {
  item: NavItem & { children: NonNullable<NavItem["children"]> };
  pathname: string;
  open: boolean;
  onToggle: () => void;
}) {
  const activeChildHref = pickActiveChildHref(
    pathname,
    item.children.map((child) => child.href)
  );
  const hasActiveChild = activeChildHref !== null;

  const Icon = item.icon;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
          hasActiveChild
            ? "text-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 transition-transform duration-150", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.href}
              href={child.href}
              label={child.label}
              icon={child.icon}
              active={child.href === activeChildHref}
              indented
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarNav({
  profile,
  moduleFlags,
}: {
  profile: Profile;
  moduleFlags: Record<string, ModuleFlag>;
}) {
  const pathname = usePathname();
  const items = filterNavItems(NAV_CONFIG[profile.role], profile.role, moduleFlags);

  // Acordeón exclusivo: solo un grupo abierto a la vez. `undefined` = el
  // usuario todavía no tocó ningún toggle => se auto-expande el grupo cuya
  // ruta activa caiga adentro. En cuanto toca uno a mano, ese gesto manda
  // (incluso para cerrar el que estaba auto-abierto).
  const activeGroupLabel =
    items.find(
      (item) =>
        item.children &&
        item.children.some((child) => isItemActive(pathname, child.href, profile.role))
    )?.label ?? null;
  const [manualOpenGroup, setManualOpenGroup] = React.useState<string | null | undefined>(
    undefined
  );
  const openGroup = manualOpenGroup === undefined ? activeGroupLabel : manualOpenGroup;

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) =>
        item.children ? (
          <NavGroup
            key={item.label}
            item={item as NavItem & { children: NonNullable<NavItem["children"]> }}
            pathname={pathname}
            open={openGroup === item.label}
            onToggle={() =>
              setManualOpenGroup(openGroup === item.label ? null : item.label)
            }
          />
        ) : (
          <NavLink
            key={item.href}
            href={item.href!}
            label={item.label}
            icon={item.icon}
            active={isItemActive(pathname, item.href!, profile.role)}
          />
        )
      )}
    </nav>
  );
}

function BrandHeader({ branding }: { branding: AgencyBranding }) {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
      {branding.logo_light_url || branding.logo_dark_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- URL de logo arbitraria configurada por el admin, no se puede allowlistar en next.config en runtime. */}
          <img
            src={branding.logo_light_url ?? branding.logo_dark_url ?? undefined}
            alt={branding.app_name}
            className="block size-7 rounded-md object-contain dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={branding.logo_dark_url ?? branding.logo_light_url ?? undefined}
            alt={branding.app_name}
            className="hidden size-7 rounded-md object-contain dark:block"
          />
        </>
      ) : (
        <Image src="/logo.png" alt={branding.app_name} width={28} height={28} className="rounded-md" />
      )}
      <span className="truncate text-sm font-semibold tracking-tight">{branding.app_name}</span>
    </div>
  );
}

/**
 * Layout de aplicación compartido por los 3 roles: sidebar de navegación
 * (adaptada según `profile.role` vía NAV_CONFIG), topbar con toggle de tema
 * y menú de usuario. Este es el "cascarón" dentro del que vive cada Dashboard.
 */
export function AppShell({
  profile,
  children,
  activity,
  notifications,
  unreadCount,
  branding,
  moduleFlags,
}: AppShellProps) {
  const [profileOpen, setProfileOpen] = React.useState(false);

  return (
    <div className="bg-sidebar min-h-dvh">
      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="border-sidebar-border bg-sidebar hidden w-60 shrink-0 flex-col border-r md:flex">
          <BrandHeader branding={branding} />
          <SidebarNav profile={profile} moduleFlags={moduleFlags} />
        </aside>

        <div className="bg-background flex min-h-dvh flex-1 flex-col md:rounded-tl-xl md:border-l md:border-t md:border-border">
          {/* Topbar */}
          <header className="flex h-14 items-center justify-between gap-3 border-b border-border px-4">
            <div className="flex items-center gap-2">
              {/* Sidebar mobile */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <SheetTitle className="sr-only">Menú</SheetTitle>
                  <BrandHeader branding={branding} />
                  <SidebarNav profile={profile} moduleFlags={moduleFlags} />
                </SheetContent>
              </Sheet>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {ROLE_LABELS[profile.role]}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <ActivityPanel events={activity} />
              <NotificationsPanel notifications={notifications} unreadCount={unreadCount} />
              <SettingsPanel />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-accent">
                    <Avatar className="size-7">
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {getInitials(profile.full_name || profile.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-32 truncate sm:inline">
                      {profile.full_name || profile.email}
                    </span>
                    <ChevronDown className="text-muted-foreground size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-medium text-foreground">
                      {profile.full_name || "Sin nombre"}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {profile.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setProfileOpen(true);
                    }}
                  >
                    <UserCircle />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <LogoutMenuItem />
                </DropdownMenuContent>
              </DropdownMenu>
              <MyProfileDialog profile={profile} open={profileOpen} onOpenChange={setProfileOpen} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
