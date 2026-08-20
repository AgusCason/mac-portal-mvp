"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireRole } from "@/lib/auth";
import { createClient as createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getClientMetricsSummary } from "@/lib/queries/social";
import { generateReportSummary, buildReportPdf } from "@/lib/reports";

const REPORT_PERIOD_DAYS = 30;
const REPORTS_BUCKET = "reports";

const generateReportSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(2, "El título es obligatorio"),
});

export type GenerateReportResult =
  | { ok: true; reportId: string }
  | { ok: false; error: string };

/**
 * ENTREGABLE — Reportes con IA (Tarea #23). Flujo completo:
 *  1. Junta datos reales del cliente: piezas publicadas en los últimos 30
 *     días + métricas agregadas de sus redes conectadas.
 *  2. Le pide a Claude el resumen ejecutivo estructurado (`generateReportSummary`).
 *  3. Arma el PDF final (`buildReportPdf`) y lo sube al bucket privado
 *     `reports` con la Service Role Key.
 *  4. Guarda la fila en `performance_reports` como "draft" — el admin lo
 *     revisa (`getReportDownloadUrlAction`) y recién después decide
 *     publicarlo (`publishReportAction`) para que el cliente lo vea.
 * Nunca se habilita nada al cliente automáticamente: la revisión humana
 * antes de publicar es intencional, así el admin filtra cualquier reporte
 * generado con datos incompletos.
 */
export async function generateReportAction(formData: FormData): Promise<GenerateReportResult> {
  const admin = await requireAdmin();
  const parsed = generateReportSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", parsed.data.clientId)
    .single();
  if (clientError || !client) {
    return { ok: false, error: "No se encontró el cliente." };
  }

  const { data: planRow } = await supabase
    .from("client_plans")
    .select("plans(name)")
    .eq("client_id", client.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  const planName = (planRow?.plans as unknown as { name: string } | null)?.name ?? null;

  const since = new Date(Date.now() - REPORT_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: publishedRows } = await supabase
    .from("content_items")
    .select("title, network")
    .eq("client_id", client.id)
    .eq("status", "publicado")
    .gte("updated_at", since);

  const metrics = await getClientMetricsSummary(client.id, REPORT_PERIOD_DAYS);

  let summary: string;
  try {
    summary = await generateReportSummary({
      clientName: client.name,
      planName,
      periodLabel: `Últimos ${REPORT_PERIOD_DAYS} días`,
      publishedPieces: (publishedRows ?? []).map((r) => ({ title: r.title, network: r.network })),
      metrics,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo generar el resumen con Claude.",
    };
  }

  const generatedAt = new Date();
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await buildReportPdf({
      title: parsed.data.title,
      clientName: client.name,
      periodLabel: `Últimos ${REPORT_PERIOD_DAYS} días`,
      generatedAt,
      summary,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo armar el PDF.",
    };
  }

  const serviceRole = createServiceRoleClient();
  const pdfPath = `${client.id}/${generatedAt.getTime()}.pdf`;
  const { error: uploadError } = await serviceRole.storage
    .from(REPORTS_BUCKET)
    .upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: false });
  if (uploadError) {
    return { ok: false, error: `No se pudo guardar el PDF: ${uploadError.message}` };
  }

  const { data: report, error: insertError } = await supabase
    .from("performance_reports")
    .insert({
      client_id: client.id,
      title: parsed.data.title,
      summary,
      pdf_path: pdfPath,
      generated_by: admin.id,
    })
    .select("id")
    .single();

  if (insertError || !report) {
    return { ok: false, error: insertError?.message ?? "No se pudo guardar el reporte." };
  }

  revalidatePath("/admin/asistente");
  revalidatePath("/admin/redes");
  return { ok: true, reportId: report.id };
}

/** Habilita un reporte para que el cliente lo vea. Solo admin — decisión manual. */
export async function publishReportAction(reportId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("performance_reports")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/redes");
  revalidatePath("/client/reportes");
  return { ok: true };
}

/**
 * Genera una signed URL de corta duración para ver/descargar el PDF de un
 * reporte. La autorización real pasa por el SELECT de acá arriba con el
 * cliente RLS-aware del usuario logueado (admin ve cualquiera; el cliente
 * solo el suyo y solo si está publicado — ver policy
 * `performance_reports_member_select`) — recién si ese SELECT encuentra la
 * fila usamos la Service Role Key para firmar la URL. El bucket en sí no
 * tiene ninguna policy de lectura (ver migración 0008): sin este paso
 * previo, nadie puede generar una URL válida.
 */
export async function getReportDownloadUrlAction(
  reportId: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireRole(["admin", "client"]);
  const supabase = await createSupabaseServerClient();
  const { data: report, error } = await supabase
    .from("performance_reports")
    .select("pdf_path")
    .eq("id", reportId)
    .single();

  if (error || !report?.pdf_path) {
    return { ok: false, error: "No tenés acceso a este reporte." };
  }

  const serviceRole = createServiceRoleClient();
  const { data: signed, error: signError } = await serviceRole.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(report.pdf_path, 60);

  if (signError || !signed?.signedUrl) {
    return { ok: false, error: "No se pudo generar el link de descarga." };
  }
  return { ok: true, url: signed.signedUrl };
}
