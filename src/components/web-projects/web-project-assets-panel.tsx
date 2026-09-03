"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2, Plus, Trash2, CheckCircle2, MessageSquareWarning } from "lucide-react";

import {
  createWebProjectAssetAction,
  deleteWebProjectAssetAction,
  submitWebAssetDecisionAction,
} from "@/app/actions/web-projects";
import type { WebProjectAsset } from "@/types/database";
import {
  WEB_ASSET_STATUS_VARIANT,
  getWebAssetStatusLabel,
} from "@/components/web-projects/web-project-stage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatDate } from "@/lib/utils";

function NewAssetDialog({ projectId }: { projectId: string }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createWebProjectAssetAction(projectId, formData);
      if (res.ok) {
        toast.success(t("components.webProjects.assetCreated", "Entregable agregado"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus /> {t("components.webProjects.newAsset", "Nuevo entregable")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.webProjects.newAssetTitle", "Nuevo entregable")}</DialogTitle>
            <DialogDescription>
              {t("components.webProjects.newAssetDesc", "Pegá el link (mockup, staging, Figma, etc.).")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="asset-title">{t("components.webProjects.assetTitleLabel", "Título")}</Label>
            <Input
              id="asset-title"
              name="title"
              required
              placeholder={t("components.webProjects.assetTitlePlaceholder", "Ej: Home — propuesta 1")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asset-url">{t("components.webProjects.assetUrlLabel", "URL")}</Label>
            <Input id="asset-url" name="fileUrl" type="url" required placeholder="https://..." />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("components.webProjects.create", "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RequestChangesDialog({ assetId }: { assetId: string }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await submitWebAssetDecisionAction(assetId, "requiere_cambios", String(formData.get("note") ?? ""));
      if (res.ok) {
        toast.success(t("components.webProjects.changesRequested", "Cambios solicitados"));
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageSquareWarning /> {t("components.webProjects.requestChanges", "Pedir cambios")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.webProjects.requestChanges", "Pedir cambios")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="note">{t("components.webProjects.feedbackLabel", "Feedback (opcional)")}</Label>
            <Textarea
              id="note"
              name="note"
              placeholder={t("components.webProjects.feedbackPlaceholder", "Contanos qué cambiarías...")}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("components.webProjects.requestChanges", "Pedir cambios")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssetCard({
  asset,
  projectId,
  role,
}: {
  asset: WebProjectAsset;
  projectId: string;
  role: "admin" | "client";
}) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteWebProjectAssetAction(asset.id, projectId);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function handleApprove() {
    startTransition(async () => {
      const res = await submitWebAssetDecisionAction(asset.id, "aprobado");
      if (res.ok) {
        toast.success(t("components.webProjects.assetApproved", "Entregable aprobado"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card className="glass-card gap-2 py-3">
      <CardHeader className="px-3">
        <CardTitle className="flex items-start justify-between gap-2 text-sm font-medium">
          <span className="line-clamp-2">{asset.title}</span>
          <Badge variant={WEB_ASSET_STATUS_VARIANT[asset.status]}>{getWebAssetStatusLabel(asset.status, t)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3">
        <p className="text-muted-foreground text-xs">{formatDate(asset.created_at)}</p>
        {asset.status === "requiere_cambios" && asset.client_note && (
          <p className="bg-muted rounded-md p-2 text-xs">{asset.client_note}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <a href={asset.file_url} target="_blank" rel="noreferrer">
              <ExternalLink /> {t("components.webProjects.viewAsset", "Ver")}
            </a>
          </Button>
          {role === "client" && asset.status === "pendiente" && (
            <>
              <Button size="sm" onClick={handleApprove} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                {t("components.webProjects.approve", "Aprobar")}
              </Button>
              <RequestChangesDialog assetId={asset.id} />
            </>
          )}
          {role === "admin" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={isPending}
              aria-label={t("components.webProjects.deleteAssetAria", "Eliminar entregable")}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Panel de entregables de un proyecto — admin carga/borra, cliente aprueba o pide cambios. */
export function WebProjectAssetsPanel({
  projectId,
  assets,
  role,
}: {
  projectId: string;
  assets: WebProjectAsset[];
  role: "admin" | "client";
}) {
  const { t } = useLocale();

  return (
    <Card className="glass-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">{t("components.webProjects.assets", "Entregables")}</CardTitle>
        {role === "admin" && <NewAssetDialog projectId={projectId} />}
      </CardHeader>
      <CardContent>
        {assets.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {t("components.webProjects.noAssets", "Todavía no hay entregables cargados.")}
          </p>
        )}
        {assets.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} projectId={projectId} role={role} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
