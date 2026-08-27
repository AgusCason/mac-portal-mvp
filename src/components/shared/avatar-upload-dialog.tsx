"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getInitials } from "@/lib/utils";

/**
 * Carga de avatar directo navegador → Supabase Storage (bucket `avatars`,
 * ver migración 0005): cada usuario solo puede escribir dentro de su propia
 * carpeta (`storage.foldername(name))[1] = auth.uid()`), y el trigger de
 * 0006 impide que este mismo camino se use para tocar `role`. Es la única
 * mutación de la app que no pasa por un Server Action — Storage necesita el
 * upload en el propio navegador para no cargar el archivo dos veces.
 */
export function AvatarUploadDialog({
  profileId,
  fullName,
  email,
  avatarUrl,
}: {
  profileId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(avatarUrl);
  const [isUploading, setIsUploading] = React.useState(false);
  const router = useRouter();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected) setPreview(URL.createObjectURL(selected));
  }

  async function handleSave() {
    if (!file) return;
    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${profileId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: pub.publicUrl })
        .eq("id", profileId);
      if (updateError) throw updateError;

      toast.success(t("components.shared.avatarUpdated", "Foto de perfil actualizada"));
      setOpen(false);
      setFile(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("components.shared.avatarUploadError", "No se pudo subir la imagen."));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="group relative shrink-0" aria-label={t("components.shared.changeAvatarAria", "Cambiar foto de perfil")}>
          <Avatar className="size-14">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="text-base">{getInitials(fullName || email)}</AvatarFallback>
          </Avatar>
          <span className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <Camera className="size-4" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("components.shared.photoTitle", "Foto de perfil")}</DialogTitle>
          <DialogDescription>
            {t("components.shared.photoDesc", "Se sube directo a tu cuenta — solo vos podés cambiarla.")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <Avatar className="size-24">
            <AvatarImage src={preview ?? undefined} />
            <AvatarFallback className="text-lg">{getInitials(fullName || email)}</AvatarFallback>
          </Avatar>
          <Input type="file" accept="image/*" onChange={onFileChange} disabled={isUploading} />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!file || isUploading}>
            {isUploading && <Loader2 className="animate-spin" />}
            {t("common.save", "Guardar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
