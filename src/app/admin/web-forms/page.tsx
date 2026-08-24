import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { getWebForms } from "@/lib/queries/web-forms";
import { NewWebFormDialog } from "@/components/web-forms/new-web-form-dialog";
import { WebFormsTable } from "@/components/web-forms/web-forms-table";

/**
 * Management > Web Forms — formularios públicos embebibles (`/f/[id]`),
 * sin autenticación, con respuestas guardadas en `form_submissions`.
 */
export default async function AdminWebFormsPage() {
  await requireAdmin();
  const [forms, headersList] = await Promise.all([getWebForms(), headers()]);

  const host = headersList.get("host") ?? "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Web Forms</h1>
          <p className="text-muted-foreground text-sm">Formularios públicos para captar leads o respuestas.</p>
        </div>
        <NewWebFormDialog />
      </div>
      <WebFormsTable forms={forms} baseUrl={baseUrl} />
    </div>
  );
}
