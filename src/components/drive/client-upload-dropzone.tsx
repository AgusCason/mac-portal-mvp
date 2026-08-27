"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud, CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { createUploadSessionAction } from "@/app/actions/drive";
import { uploadToDriveSession } from "@/lib/drive-upload";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

/**
 * Galería plana con Drag & Drop directo a la carpeta "Crudos" del cliente en
 * Drive (Módulo Cliente — subida de raw footage). Reutiliza el mismo camino
 * de subida resumable que el modal de entrega del editor
 * (`createUploadSessionAction` + `uploadToDriveSession`): el archivo viaja
 * navegador → Google, nunca pasa por nuestro servidor.
 */
export function ClientUploadDropzone({ clientId }: { clientId: string }) {
  const { t } = useLocale();
  const [isDragging, setIsDragging] = React.useState(false);
  const [tasks, setTasks] = React.useState<UploadTask[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  function uploadFile(file: File) {
    const taskId = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setTasks((prev) => [...prev, { id: taskId, name: file.name, progress: 0, status: "uploading" }]);

    void (async () => {
      const session = await createUploadSessionAction(
        clientId,
        "crudos",
        file.name,
        file.type || "application/octet-stream"
      );
      if (!session.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: "error", error: session.error } : t))
        );
        toast.error(session.error);
        return;
      }

      try {
        await uploadToDriveSession(session.uploadUrl, file, (pct) => {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, progress: pct } : t)));
        });
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "done", progress: 100 } : t)));
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : t("components.drive.uploadErrorGeneric", "No se pudo subir el archivo.");
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "error", error: message } : t)));
        toast.error(message);
      }
    })();
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-150",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
        )}
      >
        <UploadCloud className="text-muted-foreground size-8" strokeWidth={1.5} />
        <p className="text-sm font-medium">{t("components.drive.dropzoneTitle", "Arrastrá tus clips acá, o hacé clic para elegirlos")}</p>
        <p className="text-muted-foreground text-xs">
          {t("components.drive.dropzoneDesc", "Se suben directo a tu carpeta de Crudos en Drive.")}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
              {task.status === "uploading" && <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />}
              {task.status === "done" && <CheckCircle2 className="size-4 shrink-0 text-success" />}
              {task.status === "error" && <XCircle className="text-destructive size-4 shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="truncate">{task.name}</p>
                {task.status === "uploading" && <Progress value={task.progress} className="mt-1" />}
                {task.status === "error" && (
                  <p className="text-destructive text-xs">{task.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
