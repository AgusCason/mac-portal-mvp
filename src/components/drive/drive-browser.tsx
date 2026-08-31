"use client";

import * as React from "react";
import { useTransition } from "react";
import { FileVideo, FileImage, File as FileIcon, Download, ExternalLink } from "lucide-react";

import { getClientDriveFilesAction } from "@/app/actions/drive";
import type { DriveFileSummary } from "@/lib/google-drive";
import type { DriveFolderType } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

const FOLDER_TABS: {
  value: DriveFolderType;
  labelKey: string;
  fallback: string;
  hintKey: string;
  hintFallback: string;
}[] = [
  {
    value: "crudos",
    labelKey: "components.drive.tabCrudos",
    fallback: "Crudos",
    hintKey: "components.drive.tabCrudosHint",
    hintFallback: "El material original, tal como lo subiste o lo subió la agencia — todavía sin editar.",
  },
  {
    value: "en_edicion",
    labelKey: "components.drive.tabEnEdicion",
    fallback: "En Edición",
    hintKey: "components.drive.tabEnEdicionHint",
    hintFallback: "Lo que el equipo está editando ahora mismo — borradores de trabajo.",
  },
  {
    value: "entregables_finales",
    labelKey: "components.drive.tabEntregablesFinales",
    fallback: "Entregables Finales",
    hintKey: "components.drive.tabEntregablesFinalesHint",
    hintFallback: "El contenido terminado y listo para publicar o descargar.",
  },
];

// Nota: no guardamos el ícono en una variable tipo componente (`const Icon = ...`)
// porque el linter de React trata a las variables con mayúscula inicial como
// definiciones de componente "creadas en cada render". Devolvemos JSX directo.
function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const className = "text-muted-foreground size-8";
  if (mimeType.startsWith("video/")) return <FileVideo className={className} strokeWidth={1.5} />;
  if (mimeType.startsWith("image/")) return <FileImage className={className} strokeWidth={1.5} />;
  return <FileIcon className={className} strokeWidth={1.5} />;
}

function FileCard({ file }: { file: DriveFileSummary }) {
  const { t } = useLocale();
  const viewLabel = t("components.drive.viewButton", "Ver");
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="bg-muted flex aspect-video items-center justify-center">
        {file.thumbnailLink ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.thumbnailLink}
            alt={file.name}
            className="size-full object-cover"
          />
        ) : (
          <FileTypeIcon mimeType={file.mimeType} />
        )}
      </div>
      <CardContent className="space-y-2 p-3">
        <p className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
        <div className="flex gap-2">
          {file.webViewLink && (
            <Button asChild size="sm" variant="outline" className="flex-1">
              <a href={file.webViewLink} target="_blank" rel="noreferrer">
                <ExternalLink /> {viewLabel}
              </a>
            </Button>
          )}
          {file.webViewLink && (
            <Button asChild size="icon" variant="ghost" aria-label={t("components.drive.downloadButton", "Descargar")}>
              <a
                href={`https://drive.google.com/uc?export=download&id=${file.id}`}
                target="_blank"
                rel="noreferrer"
                title={t("components.drive.downloadButton", "Descargar")}
              >
                <Download />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Previsualizador de Google Drive (Módulo A). Lista archivos de la
 * subcarpeta activa sin salir del portal; el fetch pasa siempre por la
 * Server Action `getClientDriveFilesAction`, que valida RLS + permisos
 * granulares del editor antes de tocar la API de Drive.
 */
export function DriveBrowser({ clientId }: { clientId: string }) {
  const { t } = useLocale();
  const [active, setActive] = React.useState<DriveFolderType>("entregables_finales");
  const [files, setFiles] = React.useState<DriveFileSummary[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    startTransition(async () => {
      setFiles(null);
      setError(null);
      const res = await getClientDriveFilesAction(clientId, active);
      if (res.ok) setFiles(res.files);
      else setError(res.error);
    });
  }, [clientId, active, startTransition]);

  return (
    <Tabs value={active} onValueChange={(v) => setActive(v as DriveFolderType)}>
      <TabsList>
        {FOLDER_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {t(tab.labelKey, tab.fallback)}
          </TabsTrigger>
        ))}
      </TabsList>
      {FOLDER_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4 space-y-3">
          <p className="text-muted-foreground text-sm">{t(tab.hintKey, tab.hintFallback)}</p>
          {isPending && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-video w-full" />
              ))}
            </div>
          )}
          {!isPending && error && (
            <p className="text-muted-foreground text-sm">{error}</p>
          )}
          {!isPending && files && files.length === 0 && (
            <p className="text-muted-foreground text-sm">
              {t("components.drive.emptyFolder", "Todavía no hay archivos en esta carpeta.")}
            </p>
          )}
          {!isPending && files && files.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {files.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
