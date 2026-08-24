"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";

import { deleteUtmLinkAction } from "@/app/actions/analytics";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { UtmLink } from "@/types/database";

export function UtmHistory({ links }: { links: (UtmLink & { clientName: string | null })[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteUtmLinkAction(id);
      if (res.ok) {
        toast.success("Campaña eliminada");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (links.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Todavía no armaste ninguna campaña UTM.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaña</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Fuente / Medio</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="font-medium">{link.utm_campaign}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {link.clientName ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {link.utm_source} / {link.utm_medium}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(link.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" onClick={() => copy(link.generated_url)}>
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => remove(link.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
