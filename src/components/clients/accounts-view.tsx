"use client";

import * as React from "react";
import { LayoutGrid, List, Search, Star } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { AccountCard } from "@/components/clients/account-card";
import { cn, formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import type { AccountCardData } from "@/lib/queries/clients";

type StatusFilter = "active" | "all";
type ViewMode = "grid" | "table";

/**
 * Vista de Cuentas — barra de filtros (Activas/Todas, Favoritos, buscador) +
 * grilla de tarjetas o tabla, tal como el toggle de vistas de MB Suite
 * (`/demo-agency/accounts`). Filtrado 100% client-side: la cantidad de
 * cuentas de una agencia real no justifica ida y vuelta al server por letra
 * tipeada.
 */
export function AccountsView({ accounts }: { accounts: AccountCardData[] }) {
  const { t } = useLocale();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("active");
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [view, setView] = React.useState<ViewMode>("grid");

  const STATUS_LABEL: Record<string, string> = {
    active: t("components.clients.statusActive", "Activa"),
    paused: t("components.clients.statusPaused", "Pausada"),
    churned: t("components.clients.statusChurned", "Perdida"),
  };

  const filtered = accounts.filter((a) => {
    if (statusFilter === "active" && a.status !== "active") return false;
    if (favoritesOnly && !a.isFavorite) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!a.name.toLowerCase().includes(q) && !(a.brandName ?? "").toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("components.clients.searchPlaceholder", "Buscar...")}
            className="h-8 pl-8 text-sm"
          />
        </div>

        <div className="flex items-center rounded-lg border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium transition-colors",
              statusFilter === "active" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("components.clients.filterActive", "Activas")}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium transition-colors",
              statusFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("components.clients.filterAll", "Todas")}
          </button>
        </div>

        <Button
          type="button"
          size="sm"
          variant={favoritesOnly ? "default" : "outline"}
          onClick={() => setFavoritesOnly((v) => !v)}
          className="h-8"
        >
          <Star className={cn("size-3.5", favoritesOnly && "fill-current")} />
          {t("components.clients.favorites", "Favoritos")}
        </Button>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label={t("components.clients.viewAsGrid", "Ver como grilla")}
            className={cn(
              "rounded-md p-1.5",
              view === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-label={t("components.clients.viewAsTable", "Ver como tabla")}
            className={cn(
              "rounded-md p-1.5",
              view === "table" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {accounts.length === 0
            ? t("components.clients.emptyNoAccounts", "Todavía no cargaste ninguna cuenta.")
            : t("components.clients.emptyNoMatches", "Ninguna cuenta coincide con estos filtros.")}
        </p>
      )}

      {filtered.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      {filtered.length > 0 && view === "table" && (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("components.clients.colAccount", "Cuenta")}</TableHead>
                <TableHead>{t("components.clients.colStatus", "Estado")}</TableHead>
                <TableHead>{t("components.clients.colSubscription", "Suscripción")}</TableHead>
                <TableHead>{t("components.clients.colTeam", "Equipo")}</TableHead>
                <TableHead>{t("components.clients.colSignedUp", "Alta")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/clientes/${account.id}`} className="hover:underline">
                      {account.name}
                    </Link>
                    {account.brandName && (
                      <p className="text-muted-foreground text-xs">{account.brandName}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.status === "active" ? "success" : "secondary"}>
                      {STATUS_LABEL[account.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.planName ? "info" : "outline"}>
                      {account.planName
                        ? `${t("components.clients.withSubscriptionPrefix", "Con suscripción —")} ${account.planName}`
                        : t("components.clients.internal", "Interna")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {account.team.length === 0
                      ? t("components.clients.noTeamDash", "—")
                      : account.team.map((member) => member.name).join(", ")}
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">{formatDate(account.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
