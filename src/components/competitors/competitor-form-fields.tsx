import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CompetitorWithClient } from "@/lib/queries/competitors";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

export function CompetitorFormFields({
  competitor,
  clients,
}: {
  competitor?: CompetitorWithClient;
  clients: { id: string; name: string }[];
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required defaultValue={competitor?.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="platform">Plataforma</Label>
          <Select name="platform" defaultValue={competitor?.platform ?? "instagram"}>
            <SelectTrigger id="platform" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLATFORM_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="handle">Usuario / handle</Label>
          <Input id="handle" name="handle" placeholder="@marca" defaultValue={competitor?.handle ?? ""} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="followersCount">Seguidores</Label>
          <Input
            id="followersCount"
            name="followersCount"
            type="number"
            min={0}
            defaultValue={competitor?.followers_count ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="engagementRate">Engagement (%)</Label>
          <Input
            id="engagementRate"
            name="engagementRate"
            type="number"
            min={0}
            max={100}
            step="0.01"
            defaultValue={competitor?.engagement_rate ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="clientId">Cuenta a la que se compara (opcional)</Label>
        <Select name="clientId" defaultValue={competitor?.client_id ?? "none"}>
          <SelectTrigger id="clientId" className="w-full">
            <SelectValue placeholder="General" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">General</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Input id="notes" name="notes" defaultValue={competitor?.notes ?? ""} />
      </div>
    </>
  );
}
