"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUDIT_ACTION_LABELS, getAuditActionLabel } from "@/lib/audit-labels";
import { useLocale } from "@/lib/i18n/locale-context";

export interface AuditLogUserOption {
  id: string;
  label: string;
}

/** Filtros de Configuración > Auditoría: fecha desde/hasta + tipo de acción + usuario, como query params (misma idea que TaskFilters). */
export function AuditLogFiltersBar({ users }: { users: AuditLogUserOption[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get("desde") ?? "";
  const to = searchParams.get("hasta") ?? "";
  const action = searchParams.get("accion") ?? "all";
  const usuario = searchParams.get("usuario") ?? "all";

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all") params.delete(name);
    else params.set(name, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = Boolean(from) || Boolean(to) || action !== "all" || usuario !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        value={from}
        onChange={(e) => setParam("desde", e.target.value)}
        className="w-40"
        aria-label={t("components.config.fromLabel", "Desde")}
      />
      <span className="text-muted-foreground text-sm">→</span>
      <Input
        type="date"
        value={to}
        onChange={(e) => setParam("hasta", e.target.value)}
        className="w-40"
        aria-label={t("components.config.toLabel", "Hasta")}
      />

      <Select value={action} onValueChange={(v) => setParam("accion", v)}>
        <SelectTrigger className="w-56" size="sm">
          <SelectValue placeholder={t("components.config.actionTypeFilterPlaceholder", "Tipo de acción")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("components.config.allActionTypes", "Todos los tipos de acción")}</SelectItem>
          {Object.keys(AUDIT_ACTION_LABELS).map((type) => (
            <SelectItem key={type} value={type}>
              {getAuditActionLabel(type, t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={usuario} onValueChange={(v) => setParam("usuario", v)}>
        <SelectTrigger className="w-56" size="sm">
          <SelectValue placeholder={t("components.config.userFilterPlaceholder", "Usuario")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("components.config.allUsers", "Todos los usuarios")}</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X /> {t("components.config.clearFilters", "Limpiar")}
        </Button>
      )}
    </div>
  );
}
