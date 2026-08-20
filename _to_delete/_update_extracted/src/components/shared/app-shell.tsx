"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, ChevronDown } from "lucide-react";

import { NAV_CONFIG, ROLE_LABELS } from "@/lib/nav-config";
import type { Profile } from "@/types/database";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { LogoutMenuItem } from "@/components/shared/logout-button";

interface AppShellProps {
  profile: Profile;
  children: React.ReactNode;
}

function SidebarNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const items = NAV_CONFIG[profile.role];

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== `/${profile.role}` && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandHeader() {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
      <Image
        src="/logo.png"
        alt="MAC"
        width={28}
        height={28}
        className="rounded-md"
      />
      <span className="text-sm font-semibold tracking-tight">MAC Portal</span>
    </div>
  );
}

/**
 * Layout de aplicación compartido por los 3 roles: sidebar de navegación
 * (adaptada según `profile.role` vía NAV_CONFIG), topbar con toggle de tema
 * y menú de usuario. Este es el "cascarón" dentro del que vive cada Dashboard.
 */
export function AppShell({ profile, children }: AppShellProps) {
  return (
    <div className="bg-sidebar min-h-dvh">
      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="border-sidebar-border bg-sidebar hidden w-60 shrink-0 flex-col border-r md:flex">
          <BrandHeader />
          <SidebarNav profile={profile} />
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
                  <BrandHeader />
                  <SidebarNav profile={profile} />
                </SheetContent>
              </Sheet>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {ROLE_LABELS[profile.role]}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <ModeToggle />
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
                  <LogoutMenuItem />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
