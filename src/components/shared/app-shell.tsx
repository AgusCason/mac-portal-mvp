"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, ChevronDown, UserCircle, Activity, Bell } from "lucide-react";

import { NAV_CONFIG, ROLE_LABELS, filterNavItems, type NavItem } from "@/lib/nav-config";
import type { Profile, AgencyBranding, ModuleFlag } from "@/types/database";
import { cn, getInitials } from "@/lib/utils";
import { LocaleProvider, useLocale } from "@/lib/i18n/locale-context";
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
import { PortalHelpAssistant } from "@/components/shared/portal-help-assistant";
import type { ActivityEventWithClient } from "@/lib/queries/activity";
import type { AppNotification } from "@/types/database";

interface AppShellProps {
  profile: Profile;
  children: React.ReactNode;
  /**
   * Se reciben SIN await desde el layout (que sigue siendo dinámico por el
   * chequeo de auth) y se resuelven acá adentro, cada una en su propio
   * <Suspense> — así "Actividad" y "Notificaciones" no bloquean el render
   * del resto del shell ni de la página mientras esas dos consultas
   * (secundarias, no hacen falta para pintar el nav/sidebar) todavía están
   * en vuelo. Ver node_modules/next/dist/docs/01-app/02-guides/streaming.md.
   */
  activity: Promise<ActivityEventWithClient[]>;
  notifications: Promise<AppNotification[]>;
  unreadCount: Promise<number>;
  branding: AgencyBranding;
  moduleFlags: Record<string, ModuleFlag>;
}

/**
 * Fallback del <Suspense> de Actividad/Notificaciones — mismo tamaño y
 * posición que el botón real (icon button ghost), sin badge de contador
 * (todavía no lo sabemos) para que no haya salto de layout cuando la
 * consulta resuelve y el botón real lo reemplaza.
 */
function TopbarIconFallback({ icon: Icon, label }: { icon: LucideIconType; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="text-muted-foreground/50 inline-flex size-10 items-center justify-center rounded-lg"
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </span>
  );
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
  labelKey,
  icon: Icon,
  active,
  indented,
  collapsed,
}: {
  href: string;
  label: string;
  labelKey?: string;
  icon: LucideIconType;
  active: boolean;
  indented?: boolean;
  collapsed?: boolean;
}) {
  const { t } = useLocale();
  const resolvedLabel = labelKey ? t(labelKey, label) : label;
  return (
    <Link
      href={href}
      title={collapsed ? resolvedLabel : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
        indented && "py-1.5 pl-9 text-[13px]",
        // Colapsado: botón cuadrado de tamaño fijo (no el ícono solo achicado
        // por `items-center` del contenedor) — así el highlight de activo/hover
        // es un chip prolijo del mismo tamaño para todos los ítems, no un
        // recuadro angosto pegado al ícono.
        collapsed && "size-10 justify-center px-0 py-0",
        active
          ? "bg-primary-strong/10 text-primary-strong"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("shrink-0", indented ? "size-3.5" : "size-4")} strokeWidth={1.75} />
      {!collapsed && resolvedLabel}
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
  collapsed,
  onExpand,
}: {
  item: NavItem & { children: NonNullable<NavItem["children"]> };
  pathname: string;
  open: boolean;
  onToggle: () => void;
  collapsed?: boolean;
  onExpand?: () => void;
}) {
  const activeChildHref = pickActiveChildHref(
    pathname,
    item.children.map((child) => child.href)
  );
  const hasActiveChild = activeChildHref !== null;

  const Icon = item.icon;
  const { t } = useLocale();
  const resolvedLabel = item.key ? t(item.key, item.label) : item.label;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          // Colapsado, un grupo no tiene dónde mostrar sus hijos — el click
          // primero reabre el sidebar completo y de paso abre el grupo.
          if (collapsed) {
            onExpand?.();
            if (!open) onToggle();
            return;
          }
          onToggle();
        }}
        title={collapsed ? resolvedLabel : undefined}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
          collapsed && "size-10 justify-center px-0 py-0",
          hasActiveChild
            ? "text-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{resolvedLabel}</span>
            <ChevronDown
              className={cn("size-3.5 shrink-0 transition-transform duration-150", open && "rotate-180")}
            />
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.href}
              href={child.href}
              label={child.label}
              labelKey={child.key}
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
  collapsed,
  onExpand,
}: {
  profile: Profile;
  moduleFlags: Record<string, ModuleFlag>;
  collapsed?: boolean;
  onExpand?: () => void;
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
    <nav className={cn("flex flex-col gap-1 p-3", collapsed && "items-center px-2")}>
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
            collapsed={collapsed}
            onExpand={onExpand}
          />
        ) : (
          <NavLink
            key={item.href}
            href={item.href!}
            label={item.label}
            labelKey={item.key}
            icon={item.icon}
            active={isItemActive(pathname, item.href!, profile.role)}
            collapsed={collapsed}
          />
        )
      )}
    </nav>
  );
}

function BrandHeader({
  branding,
  collapsed,
  hideAppName,
}: {
  branding: AgencyBranding;
  collapsed?: boolean;
  hideAppName?: boolean;
}) {
  const hasCustomLogo = branding.logo_light_url || branding.logo_dark_url;
  return (
    <div
      className={cn(
        "flex h-14 items-center gap-2 border-b border-sidebar-border px-4",
        collapsed && "justify-center px-0"
      )}
    >
      {hasCustomLogo ? (
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
        // El logo default (public/logo.png) ya trae la marca "MAC" + estrella
        // en el propio archivo (fondo transparente) — un poco más alto que
        // ancho lo deja legible tanto colapsado (rail angosto) como expandido.
        <Image
          src="/logo.png"
          alt={branding.app_name}
          width={109}
          height={40}
          className={collapsed ? "h-5 w-auto" : "h-6 w-auto"}
        />
      )}
      {!hideAppName && !collapsed && (
        <span className="truncate text-sm font-semibold tracking-tight">{branding.app_name}</span>
      )}
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
  return (
    <LocaleProvider initialLanguage={profile.language}>
      <AppShellInner
        profile={profile}
        activity={activity}
        notifications={notifications}
        unreadCount={unreadCount}
        branding={branding}
        moduleFlags={moduleFlags}
      >
        {children}
      </AppShellInner>
    </LocaleProvider>
  );
}

function AppShellInner({
  profile,
  children,
  activity,
  notifications,
  unreadCount,
  branding,
  moduleFlags,
}: AppShellProps) {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const { t } = useLocale();

  // El sidebar colapsable (rail de íconos ↔ ancho completo con textos) es
  // para los 3 roles — los grupos con acordeón de admin/editor (Analytics,
  // Management, ...) ya soportan `collapsed`/`onExpand` en NavGroup: click
  // en un grupo colapsado reabre el sidebar y de paso abre ese grupo.
  // Vive solo en memoria (no localStorage): ningún layout de rol se
  // desmonta entre navegaciones client-side, así que alcanza para que el
  // estado "abierto/cerrado" se mantenga mientras se navega el portal, sin
  // arriesgar un mismatch de hidratación SSR/cliente.
  const [collapsed, setCollapsed] = React.useState(false);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="bg-sidebar min-h-dvh">
      <div className="flex">
        {/* Sidebar desktop */}
        <aside
          className={cn(
            "border-sidebar-border bg-sidebar hidden shrink-0 flex-col border-r transition-[width] duration-200 md:flex",
            collapsed ? "w-[76px]" : "w-60"
          )}
        >
          <BrandHeader branding={branding} collapsed={collapsed} hideAppName />
          <button
            type="button"
            onClick={toggleCollapsed}
            title={
              collapsed
                ? t("components.appShell.expandSidebar", "Expandir menú")
                : t("components.appShell.collapseSidebar", "Cerrar menú")
            }
            className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mx-auto my-2 flex size-7 items-center justify-center rounded-lg transition-colors duration-150"
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                collapsed ? "-rotate-90" : "rotate-90"
              )}
            />
          </button>
          <SidebarNav
            profile={profile}
            moduleFlags={moduleFlags}
            collapsed={collapsed}
            onExpand={collapsed ? toggleCollapsed : undefined}
          />
        </aside>

        {/*
          min-w-0 es crítico acá: sin él, un flex item usa min-width:auto (el
          tamaño mínimo de su contenido), así que si algo adentro no se
          reduce (una grilla ancha, texto sin wrap, etc.) este panel entero
          — topbar incluido, porque vive adentro — se estira más que el
          viewport y arrastra toda la página a un scroll lateral.
        */}
        <div className="bg-background flex min-h-dvh min-w-0 flex-1 flex-col md:rounded-tl-xl md:border-l md:border-t md:border-border">
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
                  <SheetTitle className="sr-only">{t("components.appShell.mobileMenuTitle", "Menú")}</SheetTitle>
                  <BrandHeader branding={branding} hideAppName />
                  <SidebarNav profile={profile} moduleFlags={moduleFlags} />
                </SheetContent>
              </Sheet>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {ROLE_LABELS[profile.role]}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <React.Suspense fallback={<TopbarIconFallback icon={Activity} label={t("components.shared.activity", "Actividad")} />}>
                <ActivityPanel eventsPromise={activity} />
              </React.Suspense>
              <React.Suspense fallback={<TopbarIconFallback icon={Bell} label={t("components.shared.sectionNotifications", "Notificaciones")} />}>
                <NotificationsPanel notificationsPromise={notifications} unreadCountPromise={unreadCount} />
              </React.Suspense>
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
                      {profile.full_name || t("pages.equipo.noName", "Sin nombre")}
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
                    {t("common.myProfile", "Mi Perfil")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <LogoutMenuItem />
                </DropdownMenuContent>
              </DropdownMenu>
              <MyProfileDialog
                profile={profile}
                open={profileOpen}
                onOpenChange={setProfileOpen}
                twoFactorEnabled={moduleFlags["verificacion-2fa"]?.enabled ?? false}
              />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
      {/* Solo el portal de clientes tiene el asistente de ayuda flotante —
          admin/editor ya tienen su propio "Asistente IA" (MAX) en el sidebar,
          con acceso a datos reales. Este es deliberadamente más simple. */}
      {profile.role === "client" && <PortalHelpAssistant />}
    </div>
  );
}
