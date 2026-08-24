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

/** Respuestas recibidas por un Web Form puntual. */
export default async function AdminWebFormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const form = await getPublicWebForm(id);
  if (!form) notFound();

  const submissions = await getWebFormSubmissions(id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{form.name}</h1>
        <p className="text-muted-foreground text-sm">
          {submissions.length} respuesta{submissions.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mensaje</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-sm font-medium">{s.name}</TableCell>
                <TableCell className="text-sm">{s.email}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate text-sm">{s.message}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(s.created_at).toLocaleDateString("es-AR")}
                </TableCell>
              </TableRow>
            ))}
            {submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                  Todavía no hay respuestas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
