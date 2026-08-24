"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { FileText, Download, CheckCircle2, Clock, Loader2 } from "lucide-react";

import type { ReportWithClient } from "@/lib/queries/reports";
import { getReportDownloadUrlAction, publishReportAction } from "@/app/actions/reports";
import { NOVA_AGENT } from "@/lib/ai/agents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

/**
 * Lista de reportes de performance — misma pieza para /admin/reportes
 * (borradores + publicados, con botón "Publicar") y /client/reportes (RLS
 * ya le devuelve solo los publicados de su cuenta, así que acá alcanza con
 * no mostrarle el botón de publicar).
 */
export function ReportList({
  reports,
  role,
}: {
  reports: ReportWithClient[];
  role: "admin" | "client";
}) {
  const [isPending, startTransition] = useTransition();

  function view(reportId: string) {
    startTransition(async () => {
      const res = await getReportDownloadUrlAction(reportId);
      if (res.ok) {
        window.open(res.url, "_blank", "noreferrer");
      } else {
        toast.error(res.error);
      }
    });
  }

  function publish(reportId: string) {
    startTransition(async () => {
      const res = await publishReportAction(reportId);
      if (res.ok) {
        toast.success("Reporte publicado — el cliente ya puede verlo");
      } else {
        toast.error(res.error);
      }
    });
  }

  if (reports.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {role === "admin"
          ? "Todavía no generaste ningún reporte."
          : "Todavía no hay reportes publicados para tu cuenta."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="text-muted-foreground size-4" strokeWidth={1.75} />
                <p className="text-sm font-medium">{report.title}</p>
              </div>
              <Badge variant={report.status === "published" ? "success" : "secondary"}>
                {report.status === "published" ? <CheckCircle2 /> : <Clock />}
                {report.status === "published" ? "Publicado" : "Borrador"}
              </Badge>
            </div>
            {role === "admin" && (
              <p className="text-muted-foreground truncate text-xs">{report.client_name}</p>
            )}
            {(report.period_label || report.platforms.length > 0) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {report.period_label && (
                  <Badge variant="outline" className="text-[11px]">
                    {report.period_label}
                  </Badge>
                )}
                {report.platforms.map((platform) => (
                  <Badge key={platform} variant="secondary" className="text-[11px] capitalize">
                    {platform}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-muted-foreground text-xs">
              {report.status === "published" && report.published_at
                ? `Publicado el ${formatDate(report.published_at)}`
                : `Generado el ${formatDate(report.created_at)}`}
            </p>
            <p className="text-muted-foreground text-xs">
              Redactado por <span className="font-medium">{NOVA_AGENT.name}</span> ·{" "}
              {NOVA_AGENT.role}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={isPending}
                onClick={() => view(report.id)}
              >
                {isPending ? <Loader2 className="animate-spin" /> : <Download />}
                Ver PDF
              </Button>
              {role === "admin" && report.status === "draft" && (
                <Button size="sm" disabled={isPending} onClick={() => publish(report.id)}>
                  Publicar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
