import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getClientDetail } from "@/lib/queries/clients";
import { getEditors } from "@/lib/queries/team";
import { getUnlinkedClientProfiles } from "@/lib/queries/unlinked-clients";
import { getContentItems } from "@/lib/queries/content";
import { getReports } from "@/lib/queries/reports";
import { getContracts } from "@/lib/queries/contracts";
import { getInvoices } from "@/lib/queries/billing";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { AssignEditorDialog } from "@/components/clients/assign-editor-dialog";
import { LinkClientMemberDialog } from "@/components/clients/link-client-member-dialog";
import { DriveBrowser } from "@/components/drive/drive-browser";
import { ContentBoard } from "@/components/content/content-board";
import { NewContentDialog } from "@/components/content/new-content-dialog";
import { ReportList } from "@/components/reports/report-list";
import { NewReportDialog } from "@/components/reports/new-report-dialog";
import { ContractList } from "@/components/contracts/contract-list";
import { NewContractDialog } from "@/components/contracts/new-contract-dialog";
import { InvoiceList } from "@/components/billing/invoice-list";
import { NewInvoiceDialog } from "@/components/billing/new-invoice-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  FileSignature,
  FolderOpen,
  Camera,
  ThumbsUp,
  Video,
  Globe,
  Music2,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { getT } from "@/lib/i18n/dictionary";
import type { Plan } from "@/types/database";

const PLATFORM_LINKS = [
  { key: "social_instagram", icon: Camera, label: "Instagram" },
  { key: "social_tiktok", icon: Music2, label: "TikTok" },
  { key: "social_facebook", icon: ThumbsUp, label: "Facebook" },
  { key: "social_youtube", icon: Video, label: "YouTube" },
  { key: "social_website", icon: Globe, label: "Sitio web" },
] as const;

/**
 * Ficha de cliente — Fase 2.2 de la adaptación "estilo MB Suite": funciona
 * como un mini-workspace scoped a este cliente (Resumen/Contenido/Reportes/
 * Contratos/Facturación), reusando exactamente los mismos componentes que
 * las vistas globales de cada módulo — análogo al workspace por cuenta de
 * MB Suite (/[cliente]/... vs /demo-agency/...), sin duplicar código.
 */
export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["admin"]);
  const t = getT(profile.language);
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [detail, editors, unlinkedClientProfiles, contentItems, reports, contracts, invoices, { data: plans }] =
    await Promise.all([
      getClientDetail(id),
      getEditors(),
      getUnlinkedClientProfiles(id),
      getContentItems(id),
      getReports({ clientId: id }),
      getContracts(id),
      getInvoices(id),
      supabase.from("plans").select("*").order("price_monthly"),
    ]);

  if (!detail) notFound();
  const { client, planName, assignments, contentCount, contractCount, driveFolders } = detail;
  const selectableClient = [{ id: client.id, name: client.name }];
  const planOptions = ((plans as Plan[]) ?? []).map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 rounded-lg">
            <AvatarImage src={client.logo_url ?? undefined} alt={client.name} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-base font-semibold text-primary">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground text-sm">
              {client.brand_name ?? t("pages.clienteDetail.noBrandName", "Sin nombre de marca")} ·{" "}
              {client.contact_email ?? t("pages.clienteDetail.noEmail", "sin email")}
            </p>
            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
              {PLATFORM_LINKS.filter((p) => client[p.key]).map((p) => (
                <a
                  key={p.key}
                  href={client[p.key] ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  title={p.key === "social_website" ? t("pages.clienteDetail.platformWebsite", "Sitio web") : p.label}
                  className="hover:text-foreground"
                >
                  <p.icon className="size-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={client.status === "active" ? "success" : "secondary"}>
            {client.status === "active"
              ? t("pages.clienteDetail.statusActive", "Activo")
              : client.status === "paused"
                ? t("pages.clienteDetail.statusPaused", "Pausado")
                : t("pages.clienteDetail.statusLost", "Perdido")}
          </Badge>
          {planName && (
            <Badge variant="info">
              {t("pages.clienteDetail.planPrefix", "Plan")} {planName}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label={t("pages.clienteDetail.kpiContent", "Piezas de contenido")} value={contentCount} icon={CalendarDays} />
        <KpiCard label={t("pages.clienteDetail.kpiContracts", "Contratos")} value={contractCount} icon={FileSignature} />
        <KpiCard label={t("pages.clienteDetail.kpiDriveFolders", "Carpetas en Drive")} value={driveFolders.length} icon={FolderOpen} />
      </div>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">{t("pages.clienteDetail.tabSummary", "Resumen")}</TabsTrigger>
          <TabsTrigger value="contenido">{t("pages.clienteDetail.tabContent", "Contenido")}</TabsTrigger>
          <TabsTrigger value="reportes">{t("pages.clienteDetail.tabReports", "Reportes")}</TabsTrigger>
          <TabsTrigger value="contratos">{t("pages.clienteDetail.tabContracts", "Contratos")}</TabsTrigger>
          <TabsTrigger value="facturacion">{t("pages.clienteDetail.tabBilling", "Facturación")}</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>{t("pages.clienteDetail.assignedEditors", "Editores asignados")}</CardTitle>
              <AssignEditorDialog clientId={client.id} editors={editors} />
            </CardHeader>
            <CardContent className="space-y-2">
              {assignments.length === 0 && (
                <p className="text-muted-foreground text-sm">{t("pages.clienteDetail.noEditors", "Sin editores asignados todavía.")}</p>
              )}
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{a.editor_name}</span>
                  <div className="flex gap-1.5">
                    <Badge variant={a.can_view_drive ? "info" : "outline"}>Drive</Badge>
                    <Badge variant={a.can_view_chat ? "info" : "outline"}>Chat</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>{t("pages.clienteDetail.portalUser", "Usuario del portal cliente")}</CardTitle>
              <LinkClientMemberDialog clientId={client.id} candidates={unlinkedClientProfiles} />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {t("pages.clienteDetail.portalUserHint", "Vinculá acá la cuenta con la que este cliente va a loguearse a ver su portal.")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("pages.clienteDetail.drive", "Google Drive")}</CardTitle>
            </CardHeader>
            <CardContent>
              {driveFolders.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t(
                    "pages.clienteDetail.driveNotCreated",
                    "Las carpetas de Drive todavía no se crearon (revisá las credenciales de la Service Account en .env.local)."
                  )}
                </p>
              ) : (
                <DriveBrowser clientId={client.id} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contenido" className="space-y-4">
          <div className="flex items-center justify-end">
            <NewContentDialog clients={selectableClient} />
          </div>
          <ContentBoard items={contentItems} role="admin" />
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          <div className="flex items-center justify-end">
            <NewReportDialog clients={selectableClient} />
          </div>
          <ReportList reports={reports} role="admin" />
        </TabsContent>

        <TabsContent value="contratos" className="space-y-4">
          <div className="flex items-center justify-end">
            <NewContractDialog clients={selectableClient} />
          </div>
          <ContractList contracts={contracts} role="admin" />
        </TabsContent>

        <TabsContent value="facturacion" className="space-y-4">
          <div className="flex items-center justify-end">
            <NewInvoiceDialog clients={selectableClient} plans={planOptions} />
          </div>
          <Card>
            <CardContent>
              <InvoiceList invoices={invoices} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
