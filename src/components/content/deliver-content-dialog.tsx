"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { UploadCloud, Loader2 } from "lucide-react";

import { createUploadSessionAction } from "@/app/actions/drive";
import { deliverContentAction } from "@/app/actions/content";
import { uploadToDriveSession } from "@/lib/drive-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Modal de entrega del editor. Sube el render final directo al navegador →
 * Drive (carpeta "Entregables Finales" del cliente) con progreso real, y al
 * terminar registra el archivo en la pieza — que pasa automáticamente a
 * "Por Aprobar" (ver `deliverContentAction`).
 */
export function DeliverContentDialog({
  contentId,
  clientId,
  title,
}: {
  contentId: string;
  clientId: string;
  title: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [isUploading, startUpload] = useTransition();
  const router = useRouter();

  function handleUpload() {
    if (!file) return;
    startUpload(async () => {
      setProgress(0);
      const session = await createUploadSessionAction(
        clientId,
        "entregables_finales",
        file.name,
        file.type || "application/octet-stream"
      );
      if (!session.ok) {
        toast.error(session.error);
        return;
      }

      try {
        const uploaded = await uploadToDriveSession(session.uploadUrl, file, setProgress);
        const formData = new FormData();
        formData.set("contentId", contentId);
        formData.set("driveFileId", uploaded.id);
        const res = await deliverContentAction(formData);
        if (res.ok) {
          toast.success('Entregado — pasó a "Por Aprobar"');
          setOpen(false);
          setFile(null);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo subir el archivo.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UploadCloud /> Entregar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entregar render</DialogTitle>
          <DialogDescription>
            Subí el archivo final de “{title}” a la carpeta de Entregables Finales del
            cliente en Drive. Al terminar, la pieza pasa automáticamente a “Por Aprobar”
            y el cliente puede revisarla.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="file">Archivo</Label>
          <Input
            id="file"
            type="file"
            disabled={isUploading}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {isUploading && (
          <div className="space-y-1">
            <Progress value={progress} />
            <p className="text-muted-foreground text-right text-xs tabular-nums">
              {progress}%
            </p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading && <Loader2 className="animate-spin" />}
            Subir y entregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
