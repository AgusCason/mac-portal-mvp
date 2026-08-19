import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getClients } from "@/lib/queries/clients";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { NewClientDialog } from "@/components/clients/new-client-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  paused: "Pausado",
  churned: "Perdido",
};

export default async function AdminClientesPage() {
  await requireRole(["admin"]);
  const [clients, supabase] = await Promise.all([getClients(), createSupabaseServerClient()]);
  const { data: plans } = await supabase.from("plans").select("*").order("price_monthly");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            {clients.length} cliente{clients.length === 1 ? "" : "s"} en la agencia.
          </p>
        </div>
        <NewClientDialog plans={plans ?? []} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Alta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/clientes/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                  {c.brand_name && (
                    <p className="text-muted-foreground text-xs">{c.brand_name}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={c.status === "active" ? "success" : "secondary"}>
                    {STATUS_LABEL[c.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {c.contact_email || "—"}
                </TableCell>
                <TableCell className="tabular-nums text-sm">{formatDate(c.created_at)}</TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                  Todavía no cargaste ningún cliente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
