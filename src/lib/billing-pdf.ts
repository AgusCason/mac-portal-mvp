import "server-only";
import PDFDocument from "pdfkit";
import { PAYMENT_METHOD_LABELS } from "@/lib/billing-labels";
import type { InvoiceWithRelations } from "@/lib/queries/billing";

/**
 * Comprobante en PDF de una factura — mismo patrón que `buildReportPdf()` en
 * `lib/reports.ts` (pdfkit, en memoria, sin filesystem — corre bien en un
 * Server Action serverless; ver `serverExternalPackages` en next.config.ts).
 * A diferencia de los reportes de IA, esto se genera al vuelo cada vez que
 * se pide (no hay nada que guardar: es una vista estática de datos que ya
 * están en `billing_invoices`), así que no hace falta tocar Storage ni sumar
 * ninguna tabla nueva.
 */
export function buildInvoicePdf(params: {
  agencyName: string;
  invoice: InvoiceWithRelations;
}): Promise<Buffer> {
  const { agencyName, invoice } = params;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).fillColor("#111111").text(agencyName);
    doc.fontSize(11).fillColor("#666666").text("Comprobante de factura");
    doc.moveDown(1.5);

    doc.fillColor("#111111").fontSize(14).text(`Factura ${invoice.id.slice(0, 8).toUpperCase()}`);
    doc.moveDown(0.6);

    const statusLabel: Record<string, string> = {
      paid: "Pagada",
      pending: "Pendiente",
      overdue: "Atrasada",
      cancelled: "Cancelada",
    };

    const rows: [string, string][] = [
      ["Cliente", invoice.client_name],
      ["Plan", invoice.plan_name ?? "—"],
      ["Monto", `${invoice.amount} ${invoice.currency}`],
      ["Método", PAYMENT_METHOD_LABELS[invoice.method] ?? invoice.method],
      ["Estado", statusLabel[invoice.status] ?? invoice.status],
      ["Vencimiento", invoice.due_date],
      ...(invoice.paid_at ? ([["Fecha de pago", new Date(invoice.paid_at).toLocaleDateString("es-AR")]] as [string, string][]) : []),
    ];

    doc.fontSize(11);
    for (const [label, value] of rows) {
      doc.fillColor("#666666").text(label, { continued: true, width: 160 });
      doc.fillColor("#111111").text(`   ${value}`);
      doc.moveDown(0.3);
    }

    if (invoice.notes) {
      doc.moveDown(0.8);
      doc.fillColor("#666666").fontSize(10).text("Notas");
      doc.fillColor("#111111").fontSize(11).text(invoice.notes, { align: "justify" });
    }

    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor("#999999")
      .text(`Generado el ${new Date().toLocaleDateString("es-AR")} — este comprobante es informativo, no reemplaza una factura fiscal.`);

    doc.end();
  });
}
