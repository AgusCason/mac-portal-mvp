import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContentIdeaWithClient } from "@/lib/queries/content-ideas";

export const IDEA_TYPE_LABEL: Record<string, string> = {
  serie_social: "Serie Social",
  sesion_fotos: "Sesión de Fotos",
  video_script: "Video Script",
  caption: "Caption",
  content_bank: "Content Bank",
};

export function IdeaFormFields({
  idea,
  clients,
  defaultType,
}: {
  idea?: ContentIdeaWithClient;
  clients: { id: string; name: string }[];
  defaultType?: string;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="type">Tipo</Label>
        <Select name="type" defaultValue={idea?.type ?? defaultType ?? "content_bank"}>
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(IDEA_TYPE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required defaultValue={idea?.title} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body">Contenido</Label>
        <Textarea id="body" name="body" rows={6} defaultValue={idea?.body} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="clientId">Cuenta (opcional)</Label>
        <Select name="clientId" defaultValue={idea?.client_id ?? "none"}>
          <SelectTrigger id="clientId" className="w-full">
            <SelectValue placeholder="Sin cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin cuenta</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
