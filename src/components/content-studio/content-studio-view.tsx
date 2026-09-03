"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2 } from "lucide-react";

import { deleteContentIdeaAction, updateContentIdeaAction } from "@/app/actions/content-ideas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdeaFormFields, IDEA_TYPE_KEYS } from "@/components/content-studio/idea-form-fields";
import { NewIdeaDialog } from "@/components/content-studio/new-idea-dialog";
import { MediaLibraryView } from "@/components/media-library/media-library-view";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ContentIdeaWithClient } from "@/lib/queries/content-ideas";
import type { MediaAssetWithRelations, MediaFolderWithCount } from "@/lib/queries/media-library";

function EditIdeaDialog({
  idea,
  clients,
  open,
  onOpenChange,
}: {
  idea: ContentIdeaWithClient;
  clients: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateContentIdeaAction(idea.id, formData);
      if (res.ok) {
        toast.success(t("components.contentStudio.ideaUpdated", "Idea actualizada"));
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteContentIdeaAction(idea.id);
      if (res.ok) {
        toast.success(t("components.contentStudio.ideaDeleted", "Idea eliminada"));
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("components.contentStudio.editTitle", "Editar")}</DialogTitle>
          </DialogHeader>
          <IdeaFormFields idea={idea} clients={clients} />
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Trash2 /> {t("common.delete", "Eliminar")}
            </Button>
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

function IdeaCard({ idea, clients }: { idea: ContentIdeaWithClient; clients: { id: string; name: string }[] }) {
  const { t } = useLocale();
  const [editOpen, setEditOpen] = React.useState(false);
  return (
    <div className="glass-card space-y-1.5 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{idea.title}</p>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="text-muted-foreground hover:text-foreground shrink-0"
          aria-label={t("components.contentStudio.editAriaLabel", "Editar")}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
      {idea.body && <p className="text-muted-foreground line-clamp-3 text-xs whitespace-pre-wrap">{idea.body}</p>}
      {idea.client_name && <p className="text-muted-foreground text-xs">{idea.client_name}</p>}
      <EditIdeaDialog idea={idea} clients={clients} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

function IdeaGrid({
  ideas,
  clients,
  type,
}: {
  ideas: ContentIdeaWithClient[];
  clients: { id: string; name: string }[];
  type: string;
}) {
  const { t } = useLocale();
  const filtered = ideas.filter((i) => i.type === type);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <NewIdeaDialog clients={clients} defaultType={type} />
      </div>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed py-8 text-center text-sm">
          {t("components.contentStudio.emptyIdeas", "Todavía no hay nada acá.")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} clients={clients} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ContentStudioView({
  ideas,
  clients,
  folders,
  assets,
}: {
  ideas: ContentIdeaWithClient[];
  clients: { id: string; name: string }[];
  folders: MediaFolderWithCount[];
  assets: MediaAssetWithRelations[];
}) {
  const { t } = useLocale();

  return (
    <Tabs defaultValue="serie_social" className="w-full">
      <TabsList className="flex-wrap">
        {IDEA_TYPE_KEYS.map(({ value, labelKey, fallback }) => (
          <TabsTrigger key={value} value={value}>
            {t(labelKey, fallback)}
          </TabsTrigger>
        ))}
        <TabsTrigger value="media">{t("nav.management.mediaLibrary", "Media Library")}</TabsTrigger>
      </TabsList>

      {IDEA_TYPE_KEYS.map(({ value }) => (
        <TabsContent key={value} value={value}>
          <IdeaGrid ideas={ideas} clients={clients} type={value} />
        </TabsContent>
      ))}

      <TabsContent value="media">
        <MediaLibraryView folders={folders} assets={assets} clients={clients} />
      </TabsContent>
    </Tabs>
  );
}
