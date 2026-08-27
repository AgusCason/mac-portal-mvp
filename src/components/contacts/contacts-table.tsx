"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Search, Pencil, Trash2, Loader2, Mail, Phone, UserPlus } from "lucide-react";

import { updateContactAction, deleteContactAction } from "@/app/actions/contacts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ContactFormFields } from "@/components/contacts/contact-form-fields";
import { useLocale } from "@/lib/i18n/locale-context";
import { getInitials } from "@/lib/utils";
import type { ContactWithClient } from "@/lib/queries/contacts";

function EditContactDialog({
  contact,
  clients,
}: {
  contact: ContactWithClient;
  clients: { id: string; name: string }[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateContactAction(contact.id, formData);
      if (res.ok) {
        toast.success(t("components.contacts.contactUpdated", "Contacto actualizado"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteContactAction(contact.id);
      if (res.ok) {
        toast.success(t("components.contacts.contactDeleted", "Contacto eliminado"));
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
        <button type="button" className="text-muted-foreground hover:text-foreground" aria-label={t("components.contacts.editContactAria", "Editar contacto")}>
          <Pencil className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.contacts.editContactTitle", "Editar contacto")}</DialogTitle>
          </DialogHeader>
          <ContactFormFields contact={contact} clients={clients} />
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Trash2 /> {t("common.delete", "Eliminar")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.save", "Guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ContactsTable({
  contacts,
  clients,
}: {
  contacts: ContactWithClient[];
  clients: { id: string; name: string }[];
}) {
  const { t } = useLocale();
  const [search, setSearch] = React.useState("");

  const filtered = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      c.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("components.contacts.searchPlaceholder", "Buscar...")}
          className="h-8 pl-8 text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("components.contacts.tableName", "Nombre")}</TableHead>
              <TableHead>{t("components.contacts.tableEmail", "Email")}</TableHead>
              <TableHead>{t("components.contacts.tableAccount", "Cuenta")}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-[11px]">{getInitials(contact.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1">
                        <p className="text-sm font-medium">{contact.name}</p>
                        {contact.tags.map((tag) => (
                          <Badge key={tag} variant="info" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {contact.role_title && (
                        <p className="text-muted-foreground text-xs">{contact.role_title}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex flex-col gap-0.5">
                    {contact.email && (
                      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <Mail className="size-3" /> {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <Phone className="size-3" /> {contact.phone}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {contact.client_name ?? t("components.contacts.noAccountOption", "Sin cuenta")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/clientes?fromContact=${contact.id}`}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={t("components.contacts.convertToClientAria", "Convertir en cliente")}
                      title={t("components.contacts.convertToClientAria", "Convertir en cliente")}
                    >
                      <UserPlus className="size-3.5" />
                    </Link>
                    <EditContactDialog contact={contact} clients={clients} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                  {contacts.length === 0
                    ? t("components.contacts.noContacts", "Todavía no cargaste contactos.")
                    : t("components.contacts.noResults", "Sin resultados.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
