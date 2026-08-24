"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

import { generateReportAction } from "@/app/actions/reports";
import { NOVA_AGENT } from "@/lib/ai/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewReportDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await generateReportAction(formData);
      if (res.ok) {
        toast.success("Reporte generado — revisalo antes de publicarlo");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Sparkles /> Generar reporte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Generar reporte con IA</DialogTitle>
            <DialogDescription>
              <span className="text-foreground font-medium">{NOVA_AGENT.name}</span> ·{" "}
              {NOVA_AGENT.role} junta las piezas publicadas y las métricas de redes de los
              últimos 30 días, y redacta el resumen ejecutivo. Queda como borrador — vos lo
              revisás y recién ahí lo publicás para que el cliente lo vea.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="clientId">Cliente</Label>
            <Select name="clientId" required>
              <SelectTrigger className="w-full" id="clientId">
                <SelectValue placeholder="Seleccioná un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required placeholder="Ej: Reporte mensual — Agosto 2026" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="periodLabel">Período</Label>
            <Input
              id="periodLabel"
              name="periodLabel"
              placeholder="Ej: Agosto 2026 (por defecto: Últimos 30 días)"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Plataformas que cubre</Label>
            <div className="flex flex-wrap gap-4">
              {[
                { value: "instagram", label: "Instagram" },
                { value: "tiktok", label: "TikTok" },
                { value: "youtube", label: "YouTube" },
              ].map((platform) => (
                <label
                  key={platform.value}
                  className="flex items-center gap-2 text-sm font-normal"
                >
                  <Checkbox name="platforms" value={platform.value} />
                  {platform.label}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isPending ? "Generando…" : "Generar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
