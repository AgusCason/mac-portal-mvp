import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPublicWebForm, getWebFormSubmissions } from "@/lib/queries/web-forms";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getT, resolveLocale } from "@/lib/i18n/dictionary";

const DATE_LOCALE = { es: "es-AR", en: "en-US" } as const;

/** Respuestas recibidas por un Web Form puntual. */
export default async function AdminWebFormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const t = getT(admin.language);
  const { id } = await params;

  const form = await getPublicWebForm(id);
  if (!form) notFound();

  const submissions = await getWebFormSubmissions(id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{form.name}</h1>
        <p className="text-muted-foreground text-sm">
          {submissions.length}{" "}
          {submissions.length === 1
            ? t("pages.webFormDetail.responseSingular", "respuesta")
            : t("pages.webFormDetail.responsePlural", "respuestas")}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("pages.webFormDetail.colName", "Nombre")}</TableHead>
              <TableHead>{t("pages.webFormDetail.colEmail", "Email")}</TableHead>
              <TableHead>{t("pages.webFormDetail.colMessage", "Mensaje")}</TableHead>
              <TableHead>{t("pages.webFormDetail.colDate", "Fecha")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-sm font-medium">{s.name}</TableCell>
                <TableCell className="text-sm">{s.email}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate text-sm">{s.message}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(s.created_at).toLocaleDateString(DATE_LOCALE[resolveLocale(admin.language)])}
                </TableCell>
              </TableRow>
            ))}
            {submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                  {t("pages.webFormDetail.noResponses", "Todavía no hay respuestas.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
