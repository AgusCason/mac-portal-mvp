"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Trash2, Loader2 } from "lucide-react";

import { deleteWebFormAction, toggleWebFormActiveAction } from "@/app/actions/web-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale } from "@/lib/i18n/locale-context";
import type { WebFormWithCount } from "@/lib/queries/web-forms";

export function WebFormsTable({ forms, baseUrl }: { forms: WebFormWithCount[]; baseUrl: string }) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(formId: string, next: boolean) {
    startTransition(async () => {
      const res = await toggleWebFormActiveAction(formId, next);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete(formId: string) {
    startTransition(async () => {
      const res = await deleteWebFormAction(formId);
      if (res.ok) {
        toast.success(t("components.webForms.formDeleted", "Formulario eliminado"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleCopy(formId: string) {
    const url = `${baseUrl}/f/${formId}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success(t("components.webForms.linkCopied", "Link copiado")),
      () => toast.error(t("components.webForms.linkCopyFailed", "No se pudo copiar el link"))
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("components.webForms.tableForm", "Formulario")}</TableHead>
            <TableHead>{t("components.webForms.tableResponses", "Respuestas")}</TableHead>
            <TableHead>{t("components.webForms.tableActive", "Activo")}</TableHead>
            <TableHead className="w-32" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map((form) => (
            <TableRow key={form.id}>
              <TableCell>
                <p className="text-sm font-medium">{form.name}</p>
                {form.description && <p className="text-muted-foreground text-xs">{form.description}</p>}
              </TableCell>
              <TableCell>
                <Link href={`/admin/web-forms/${form.id}`}>
                  <Badge variant="secondary" className="cursor-pointer">
                    {form.submission_count}
                  </Badge>
                </Link>
              </TableCell>
              <TableCell>
                <Switch
                  checked={form.is_active}
                  disabled={isPending}
                  onCheckedChange={(checked) => handleToggle(form.id, checked)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => handleCopy(form.id)} aria-label={t("components.webForms.copyLinkAria", "Copiar link")}>
                    <Copy className="size-3.5" />
                  </Button>
                  <a href={`/f/${form.id}`} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="ghost" className="size-7" aria-label={t("components.webForms.openFormAria", "Abrir formulario")}>
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive size-7"
                    disabled={isPending}
                    onClick={() => handleDelete(form.id)}
                    aria-label={t("components.webForms.deleteFormAria", "Eliminar formulario")}
                  >
                    {isPending ? <Loader2 className="animate-spin" /> : <Trash2 className="size-3.5" />}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {forms.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                {t("components.webForms.noForms", "Todavía no creaste formularios.")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
