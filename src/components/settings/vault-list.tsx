"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff, Copy, Pencil, Trash2, Loader2 } from "lucide-react";

import type { VaultCredentialWithClient } from "@/lib/queries/vault";
import {
  createVaultCredentialAction,
  updateVaultCredentialAction,
  revealVaultCredentialAction,
  deleteVaultCredentialAction,
} from "@/app/actions/vault";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

function CredentialFormFields({
  credential,
  clients,
  secretRequired,
}: {
  credential?: VaultCredentialWithClient;
  clients: { id: string; name: string }[];
  secretRequired: boolean;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="label">Nombre</Label>
        <Input
          id="label"
          name="label"
          required
          defaultValue={credential?.label}
          placeholder="Ej: Meta Business Suite — Café Aurora"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="username">Usuario</Label>
          <Input id="username" name="username" defaultValue={credential?.username ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clientId">Cliente (opcional)</Label>
          <Select name="clientId" defaultValue={credential?.client_id ?? "none"}>
            <SelectTrigger className="w-full" id="clientId">
              <SelectValue placeholder="Sin cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin cliente</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="secret">{secretRequired ? "Secreto" : "Secreto (dejar vacío para no cambiarlo)"}</Label>
        <Input
          id="secret"
          name="secret"
          type="password"
          required={secretRequired}
          placeholder={secretRequired ? "Contraseña, token o API key" : "••••••••"}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" type="url" defaultValue={credential?.url ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Input id="notes" name="notes" defaultValue={credential?.notes ?? ""} />
      </div>
    </>
  );
}

function NewCredentialDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createVaultCredentialAction(formData);
      if (res.ok) {
        toast.success("Credencial guardada");
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
          <KeyRound /> Nueva credencial
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nueva credencial</DialogTitle>
            <DialogDescription>
              El secreto se guarda cifrado — nadie puede verlo en texto plano sin pasar por acá.
            </DialogDescription>
          </DialogHeader>
          <CredentialFormFields clients={clients} secretRequired />
          <DialogFooter>
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

function EditCredentialDialog({
  credential,
  clients,
}: {
  credential: VaultCredentialWithClient;
  clients: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateVaultCredentialAction(credential.id, formData);
      if (res.ok) {
        toast.success("Credencial actualizada");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteVaultCredentialAction(credential.id);
      if (res.ok) {
        toast.success("Credencial eliminada");
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
        <Button size="icon" variant="ghost" aria-label="Editar credencial">
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Editar credencial</DialogTitle>
          </DialogHeader>
          <CredentialFormFields credential={credential} clients={clients} secretRequired={false} />
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

function RevealSecretButton({ credentialId }: { credentialId: string }) {
  const [secret, setSecret] = React.useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (secret) {
      setSecret(null);
      return;
    }
    startTransition(async () => {
      const res = await revealVaultCredentialAction(credentialId);
      if (res.ok) {
        setSecret(res.secret);
      } else {
        toast.error(res.error);
      }
    });
  }

  async function copy() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      toast.success("Copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button size="icon" variant="ghost" onClick={toggle} disabled={isPending} aria-label="Ver secreto">
        {isPending ? (
          <Loader2 className="animate-spin" />
        ) : secret ? (
          <EyeOff className="size-3.5" />
        ) : (
          <Eye className="size-3.5" />
        )}
      </Button>
      {secret && (
        <>
          <code className="bg-muted rounded px-2 py-1 text-xs">{secret}</code>
          <Button size="icon" variant="ghost" onClick={copy} aria-label="Copiar secreto">
            <Copy className="size-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * Bóveda de credenciales (Fase 3.3). Solo admin. El secreto nunca viaja en
 * el listado inicial — cada fila lo pide al server bajo demanda (botón del
 * ojo), que lo descifra ahí mismo con pgcrypto y la passphrase del server.
 */
export function VaultList({
  credentials,
  clients,
}: {
  credentials: VaultCredentialWithClient[];
  clients: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <NewCredentialDialog clients={clients} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Secreto</TableHead>
            <TableHead>Actualizado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                Todavía no hay credenciales guardadas.
              </TableCell>
            </TableRow>
          )}
          {credentials.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {c.label}
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground text-xs underline"
                    >
                      abrir
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{c.username || "—"}</TableCell>
              <TableCell className="text-muted-foreground">{c.client_name ?? "—"}</TableCell>
              <TableCell>
                <RevealSecretButton credentialId={c.id} />
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {formatDate(c.updated_at)}
              </TableCell>
              <TableCell className="text-right">
                <EditCredentialDialog credential={c} clients={clients} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
