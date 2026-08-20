"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Selector de cliente que sincroniza la elección con ?cliente= en la URL. */
export function ClientSelector({
  clients,
  paramName = "cliente",
}: {
  clients: { client_id: string; name: string }[];
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? clients[0]?.client_id;

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams);
    params.set(paramName, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (clients.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Todavía no tenés clientes asignados.
      </p>
    );
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Elegí un cliente" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.client_id} value={c.client_id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
