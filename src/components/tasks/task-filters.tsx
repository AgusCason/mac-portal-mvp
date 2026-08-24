"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TaskFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentView = searchParams.get("vista") ?? "pendientes";
  const currentStatus = searchParams.get("estado") ?? "all";

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all") params.delete(name);
    else params.set(name, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = currentView !== "pendientes" || currentStatus !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={currentView} onValueChange={(v) => setParam("vista", v)}>
        <SelectTrigger className="w-40" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pendientes">Pendientes</SelectItem>
          <SelectItem value="todas">Cualquier fecha</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentStatus} onValueChange={(v) => setParam("estado", v)}>
        <SelectTrigger className="w-40" size="sm">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="pendiente">Pendiente</SelectItem>
          <SelectItem value="en_curso">En curso</SelectItem>
          <SelectItem value="completada">Completada</SelectItem>
          <SelectItem value="cancelada">Cancelada</SelectItem>
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
