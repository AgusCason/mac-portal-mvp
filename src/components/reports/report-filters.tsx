"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Barra de filtros de /admin/reportes (Fase 2.1 — equivalente a los filtros
 * de cuenta/estado/período de Analytics > Reports en MB Suite). Sincroniza
 * todo con la URL (?cliente=&estado=&periodo=) para que sea compartible/
 * recargable, igual que <ClientSelector />.
 */
export function ReportFilters({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [period, setPeriod] = React.useState(searchParams.get("periodo") ?? "");

  const currentClient = searchParams.get("cliente") ?? "all";
  const currentStatus = searchParams.get("estado") ?? "all";

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all") params.delete(name);
    else params.set(name, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function submitPeriod(e: React.FormEvent) {
    e.preventDefault();
    setParam("periodo", period);
  }

  const hasFilters = currentClient !== "all" || currentStatus !== "all" || Boolean(searchParams.get("periodo"));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={currentClient} onValueChange={(v) => setParam("cliente", v)}>
        <SelectTrigger className="w-44" size="sm">
          <SelectValue placeholder="Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los clientes</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentStatus} onValueChange={(v) => setParam("estado", v)}>
        <SelectTrigger className="w-36" size="sm">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="draft">Borrador</SelectItem>
          <SelectItem value="published">Publicado</SelectItem>
        </SelectContent>
      </Select>

      <form onSubmit={submitPeriod} className="flex items-center gap-1">
        <Input
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="Período (ej: Agosto)"
          className="h-8 w-40"
        />
      </form>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPeriod("");
            router.push(pathname);
          }}
        >
          <X /> Limpiar
        </Button>
      )}
    </div>
  );
}
