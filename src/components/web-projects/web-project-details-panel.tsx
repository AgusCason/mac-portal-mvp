"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Globe, Loader2, PencilLine, Rocket, Server, Code2, CalendarClock } from "lucide-react";

import { updateWebProjectDetailsAction } from "@/app/actions/web-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatDate } from "@/lib/utils";
import type { WebProject } from "@/types/database";

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

/**
 * Datos técnicos del proyecto (dominio, staging, producción, hosting, stack,
 * fecha de lanzamiento). `editable` habilita el diálogo de edición — solo
 * para el admin; el cliente ve la misma card en modo solo-lectura.
 */
export function WebProjectDetailsPanel({
  project,
  editable = false,
}: {
  project: WebProject;
  editable?: boolean;
}) {
  const { t } = useLocale();

  const hasAnyDetail =
    project.domain || project.staging_url || project.production_url || project.hosting_provider || project.tech_stack || project.launch_date;

  return (
    <Card className="glass-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">{t("components.webProjects.technicalDetails", "Detalles técnicos")}</CardTitle>
        {editable && <EditDetailsDialog project={project} />}
      </CardHeader>
      <CardContent>
        {!hasAnyDetail && (
          <p className="text-muted-foreground text-sm">
            {t("components.webProjects.noDetails", "Todavía no se cargaron detalles técnicos.")}
          </p>
        )}
        {hasAnyDetail && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {project.domain && <Field icon={Globe} label={t("components.webProjects.domainLabel", "Dominio")} value={project.domain} />}
            {project.staging_url && (
              <Field
                icon={Code2}
                label={t("components.webProjects.stagingUrlLabel", "URL de staging")}
                value={
                  <a href={project.staging_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {project.staging_url}
                  </a>
                }
              />
            )}
            {project.production_url && (
              <Field
                icon={Rocket}
                label={t("components.webProjects.productionUrlLabel", "URL de producción")}
                value={
                  <a href={project.production_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {project.production_url}
                  </a>
                }
              />
            )}
            {project.hosting_provider && (
              <Field icon={Server} label={t("components.webProjects.hostingProviderLabel", "Hosting")} value={project.hosting_provider} />
            )}
            {project.tech_stack && (
              <Field icon={Code2} label={t("components.webProjects.techStackLabel", "Stack / Tecnología")} value={project.tech_stack} />
            )}
            {project.launch_date && (
              <Field
                icon={CalendarClock}
                label={t("components.webProjects.launchDateLabel", "Fecha de lanzamiento")}
                value={formatDate(project.launch_date)}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EditDetailsDialog({ project }: { project: WebProject }) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateWebProjectDetailsAction(project.id, formData);
      if (res.ok) {
        toast.success(t("components.webProjects.detailsUpdated", "Detalles actualizados"));
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
          <PencilLine /> {t("components.webProjects.editDetails", "Editar detalles")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.webProjects.editDetails", "Editar detalles")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="domain">{t("components.webProjects.domainLabel", "Dominio")}</Label>
              <Input id="domain" name="domain" defaultValue={project.domain ?? ""} placeholder="ejemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hostingProvider">{t("components.webProjects.hostingProviderLabel", "Hosting")}</Label>
              <Input id="hostingProvider" name="hostingProvider" defaultValue={project.hosting_provider ?? ""} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="stagingUrl">{t("components.webProjects.stagingUrlLabel", "URL de staging")}</Label>
              <Input id="stagingUrl" name="stagingUrl" defaultValue={project.staging_url ?? ""} placeholder="https://staging.ejemplo.com" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="productionUrl">{t("components.webProjects.productionUrlLabel", "URL de producción")}</Label>
              <Input id="productionUrl" name="productionUrl" defaultValue={project.production_url ?? ""} placeholder="https://ejemplo.com" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="techStack">{t("components.webProjects.techStackLabel", "Stack / Tecnología")}</Label>
              <Input id="techStack" name="techStack" defaultValue={project.tech_stack ?? ""} placeholder="Ej: Next.js + WordPress" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="launchDate">{t("components.webProjects.launchDateLabel", "Fecha de lanzamiento")}</Label>
              <Input id="launchDate" name="launchDate" type="date" defaultValue={project.launch_date ?? ""} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.save", "Guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
