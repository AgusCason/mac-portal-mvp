"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2 } from "lucide-react";

import { deleteCompetitorAction, updateCompetitorAction } from "@/app/actions/competitors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompetitorFormFields } from "@/components/competitors/competitor-form-fields";
import { NewCompetitorDialog } from "@/components/competitors/new-competitor-dialog";
import type { CompetitorWithClient } from "@/lib/queries/competitors";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

function EditCompetitorDialog({
  competitor,
  clients,
  open,
  onOpenChange,
}: {
  competitor: CompetitorWithClient;
  clients: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateCompetitorAction(competitor.id, formData);
      if (res.ok) {
        toast.success("Competidor actualizado");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteCompetitorAction(competitor.id);
      if (res.ok) {
        toast.success("Competidor eliminado");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Editar competidor</DialogTitle>
          </DialogHeader>
          <CompetitorFormFields competitor={competitor} clients={clients} />
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Trash2 /> Eliminar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProfilesTable({
  competitors,
  clients,
}: {
  competitors: CompetitorWithClient[];
  clients: { id: string; name: string }[];
}) {
  const [editing, setEditing] = React.useState<CompetitorWithClient | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Competidor</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Se compara con</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitors.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <p className="text-sm font-medium">{c.name}</p>
                {c.handle && <p className="text-muted-foreground text-xs">{c.handle}</p>}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{PLATFORM_LABEL[c.platform] ?? c.platform}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{c.client_name ?? "General"}</TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Editar"
                >
                  <Pencil className="size-3.5" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {competitors.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                Todavía no cargaste competidores.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {editing && (
        <EditCompetitorDialog
          competitor={editing}
          clients={clients}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}

function BenchmarkTable({ competitors }: { competitors: CompetitorWithClient[] }) {
  const sorted = [...competitors].sort((a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0));

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Competidor</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Seguidores</TableHead>
            <TableHead>Engagement</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-sm font-medium">{c.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{PLATFORM_LABEL[c.platform] ?? c.platform}</Badge>
              </TableCell>
              <TableCell className="tabular-nums text-sm">
                {c.followers_count != null ? c.followers_count.toLocaleString("es-AR") : "—"}
              </TableCell>
              <TableCell className="tabular-nums text-sm">
                {c.engagement_rate != null ? `${c.engagement_rate}%` : "—"}
              </TableCell>
            </TableRow>
          ))}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                Sin datos de benchmark todavía.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function CompetitorsView({
  competitors,
  clients,
}: {
  competitors: CompetitorWithClient[];
  clients: { id: string; name: string }[];
}) {
  return (
    <Tabs defaultValue="perfiles" className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="perfiles">Perfiles</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
        </TabsList>
        <NewCompetitorDialog clients={clients} />
      </div>
      <TabsContent value="perfiles">
        <ProfilesTable competitors={competitors} clients={clients} />
      </TabsContent>
      <TabsContent value="benchmark">
        <BenchmarkTable competitors={competitors} />
      </TabsContent>
    </Tabs>
  );
}
