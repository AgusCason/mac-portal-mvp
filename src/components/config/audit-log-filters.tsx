"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUDIT_ACTION_LABELS } from "@/lib/audit-labels";

/** Filtros de Configuración > Auditoría: fecha desde/hasta + tipo de acción, como query params (misma idea que TaskFilters). */
export function AuditLogFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get("desde") ?? "";
  const to = searchParams.get("hasta") ?? "";
  const action = searchParams.get("accion") ?? "all";

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all") params.delete(name);
    else params.set(name, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = Boolean(from) || Boolean(to) || action !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        value={from}
        onChange={(e) => setParam("desde", e.target.value)}
        className="w-40"
        aria-label="Desde"
      />
      <span className="text-muted-foreground text-sm">→</span>
      <Input
        type="date"
        value={to}
        onChange={(e) => setParam("hasta", e.target.value)}
        className="w-40"
        aria-label="Hasta"
      />

      <Select value={action} onValueChange={(v) => setParam("accion", v)}>
        <SelectTrigger className="w-56" size="sm">
          <SelectValue placeholder="Tipo de acción" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos de acción</SelectItem>
          {Object.entries(AUDIT_ACTION_LABELS).map(([type, label]) => (
            <SelectItem key={type} value={type}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X /> Limpiar
        </Button>
      )}
    </div>
  );
}
