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
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, FileSignature, FolderOpen } from "lucide-react";
import type { Plan } from "@/types/database";

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
  await requireRole(["admin"]);
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
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground text-sm">
            {client.brand_name ?? "Sin nombre de marca"} · {client.contact_email ?? "sin email"}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={client.status === "active" ? "success" : "secondary"}>
            {client.status === "active" ? "Activo" : client.status === "paused" ? "Pausado" : "Perdido"}
          </Badge>
          {planName && <Badge variant="info">Plan {planName}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Piezas de contenido" value={contentCount} icon={CalendarDays} />
        <KpiCard label="Contratos" value={contractCount} icon={FileSignature} />
        <KpiCard label="Carpetas en Drive" value={driveFolders.length} icon={FolderOpen} />
      </div>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="contenido">Contenido</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Editores asignados</CardTitle>
              <AssignEditorDialog clientId={client.id} editors={editors} />
            </CardHeader>
            <CardContent className="space-y-2">
              {assignments.length === 0 && (
                <p className="text-muted-foreground text-sm">Sin editores asignados todavía.</p>
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
              <CardTitle>Usuario del portal cliente</CardTitle>
              <LinkClientMemberDialog clientId={client.id} candidates={unlinkedClientProfiles} />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Vinculá acá la cuenta con la que este cliente va a loguearse a ver su portal.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Drive</CardTitle>
            </CardHeader>
            <CardContent>
              {driveFolders.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Las carpetas de Drive todavía no se crearon (revisá las credenciales de la
                  Service Account en .env.local).
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
