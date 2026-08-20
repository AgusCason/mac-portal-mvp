"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { createInvoiceAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const METHOD_OPTIONS = [
  { value: "mercadopago", label: "Mercado Pago (automático)" },
  { value: "paypal", label: "PayPal (automático)" },
  { value: "transferencia", label: "Transferencia" },
  { value: "payoneer", label: "Payoneer" },
  { value: "crypto", label: "Cripto" },
  { value: "otro", label: "Otro" },
];

export function NewInvoiceDialog({
  clients,
  plans,
}: {
  clients: { id: string; name: string }[];
  plans: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createInvoiceAction(formData);
      if (res.ok) {
        toast.success("Factura generada");
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
          <Plus /> Generar factura
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Generar factura</DialogTitle>
            <DialogDescription>
              Mercado Pago y PayPal se concilian automáticamente cuando esté disponible;
              el resto de los métodos se marcan como pagados manualmente.
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
            <Label htmlFor="planId">Plan (opcional)</Label>
            <Select name="planId">
              <SelectTrigger className="w-full" id="planId">
                <SelectValue placeholder="Sin plan asociado" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto</Label>
              <Input id="amount" name="amount" type="number" min={0} step={100} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <Input id="currency" name="currency" defaultValue="ARS" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="method">Método de pago</Label>
            <Select name="method" required defaultValue="transferencia">
              <SelectTrigger className="w-full" id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Vencimiento</Label>
            <Input id="dueDate" name="dueDate" type="date" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Generar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
