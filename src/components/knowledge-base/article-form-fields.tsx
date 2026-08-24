import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { KbArticle } from "@/types/database";

export function ArticleFormFields({ article }: { article?: KbArticle }) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required defaultValue={article?.title} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body">Contenido</Label>
        <Textarea id="body" name="body" required rows={8} defaultValue={article?.body} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="isPinned" name="isPinned" defaultChecked={article?.is_pinned} />
        <Label htmlFor="isPinned" className="font-normal">
          Fijar arriba
        </Label>
      </div>
    </>
  );
}
