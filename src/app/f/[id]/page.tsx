import { notFound } from "next/navigation";
import { getPublicWebForm } from "@/lib/queries/web-forms";
import { PublicForm } from "@/components/web-forms/public-form";

/**
 * Página PÚBLICA (sin sesión) de un Web Form — equivalente a los
 * formularios embebibles de MB Suite Management > Web Forms.
 * Solo se renderiza si el form existe y está activo (RLS en
 * `getPublicWebForm`, ver migración 0017).
 */
export default async function PublicWebFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getPublicWebForm(id);
  if (!form || !form.is_active) notFound();

  return (
    <div className="bg-muted flex min-h-screen items-center justify-center p-4">
      <div className="border-border bg-background w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight">{form.name}</h1>
        {form.description && <p className="text-muted-foreground mt-1 text-sm">{form.description}</p>}
        <div className="mt-5">
          <PublicForm formId={form.id} />
        </div>
      </div>
    </div>
  );
}
