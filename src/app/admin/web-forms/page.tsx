import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { getWebForms } from "@/lib/queries/web-forms";
import { NewWebFormDialog } from "@/components/web-forms/new-web-form-dialog";
import { WebFormsTable } from "@/components/web-forms/web-forms-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { getT } from "@/lib/i18n/dictionary";

/**
 * Management > Web Forms — formularios públicos embebibles (`/f/[id]`),
 * sin autenticación, con respuestas guardadas en `form_submissions`.
 */
export default async function AdminWebFormsPage() {
  const admin = await requireAdmin();
  const t = getT(admin.language);
  const [forms, headersList] = await Promise.all([getWebForms(), headers()]);

  const host = headersList.get("host") ?? "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const totalResponses = forms.reduce((sum, f) => sum + f.submission_count, 0);
  const topForms = [...forms].sort((a, b) => b.submission_count - a.submission_count).slice(0, 6);
  const maxResponses = Math.max(1, ...topForms.map((f) => f.submission_count));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("pages.webForms.title", "Web Forms")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.webForms.description", "Formularios públicos para captar leads o respuestas.")}
          </p>
        </div>
        <NewWebFormDialog />
      </div>

      {totalResponses > 0 && (
        <Card className="glass-card">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="icon-chip">
              <BarChart3 className="size-4" strokeWidth={1.75} />
            </div>
            <CardTitle>{t("pages.webForms.responsesByFormTitle", "Respuestas por formulario")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {topForms.map((form) => {
              const widthPct = Math.max(4, Math.round((form.submission_count / maxResponses) * 100));
              return (
                <div key={form.id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-[11.5px] font-semibold">{form.name}</span>
                  <div className="bg-accent/60 h-2 flex-1 overflow-hidden rounded-full">
                    <span className="bg-primary/80 block h-full rounded-full" style={{ width: `${widthPct}%` }} />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-bold tabular-nums">
                    {form.submission_count}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <WebFormsTable forms={forms} baseUrl={baseUrl} />
    </div>
  );
}
