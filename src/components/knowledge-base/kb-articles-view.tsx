"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Search, Star, Pin, Pencil, Trash2, Loader2, Eye } from "lucide-react";

import {
  deleteKbArticleAction,
  incrementKbViewsAction,
  toggleKbFavoriteAction,
  updateKbArticleAction,
} from "@/app/actions/knowledge-base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArticleFormFields } from "@/components/knowledge-base/article-form-fields";
import { useLocale } from "@/lib/i18n/locale-context";
import type { KbArticleWithFavorite } from "@/lib/queries/knowledge-base";

function EditArticleDialog({
  article,
  open,
  onOpenChange,
}: {
  article: KbArticleWithFavorite;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateKbArticleAction(article.id, formData);
      if (res.ok) {
        toast.success(t("components.knowledgeBase.articleUpdated", "Artículo actualizado"));
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteKbArticleAction(article.id);
      if (res.ok) {
        toast.success(t("components.knowledgeBase.articleDeleted", "Artículo eliminado"));
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
            <DialogTitle>{t("components.knowledgeBase.editArticleTitle", "Editar artículo")}</DialogTitle>
          </DialogHeader>
          <ArticleFormFields article={article} />
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

function ArticleRow({ article }: { article: KbArticleWithFavorite }) {
  const { t } = useLocale();
  const [expanded, setExpanded] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [favorite, setFavorite] = React.useState(article.is_favorite);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      startTransition(async () => {
        await incrementKbViewsAction(article.id, article.views_count);
        router.refresh();
      });
    }
  }

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const res = await toggleKbFavoriteAction(article.id, next);
      if (!res.ok) {
        setFavorite(!next);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="border-border rounded-xl border">
      <div className="flex items-center gap-2 px-4 py-3">
        <button type="button" onClick={handleToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {article.is_pinned && <Pin className="text-primary size-3.5 shrink-0" />}
          <span className="truncate text-sm font-medium">{article.title}</span>
        </button>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Eye className="size-3" /> {article.views_count}
        </span>
        <button type="button" onClick={handleFavorite} disabled={isPending} aria-label={t("components.knowledgeBase.favoriteAria", "Favorito")}>
          <Star className={`size-4 ${favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
        </button>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t("components.knowledgeBase.editArticleAria", "Editar artículo")}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="border-border text-muted-foreground border-t px-4 py-3 text-sm whitespace-pre-wrap">
          {article.body}
        </div>
      )}
      <EditArticleDialog article={article} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

export function KbArticlesView({ articles }: { articles: KbArticleWithFavorite[] }) {
  const { t } = useLocale();
  const [search, setSearch] = React.useState("");
  const [onlyFavorites, setOnlyFavorites] = React.useState(false);

  const filtered = articles.filter((a) => {
    if (onlyFavorites && !a.is_favorite) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("components.knowledgeBase.searchPlaceholder", "Buscar artículos...")}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setOnlyFavorites((v) => !v)}
          className="inline-flex"
          aria-pressed={onlyFavorites}
        >
          <Badge variant={onlyFavorites ? "default" : "secondary"} className="cursor-pointer gap-1">
            <Star className="size-3" /> {t("components.knowledgeBase.favorites", "Favoritos")}
          </Badge>
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((article) => (
          <ArticleRow key={article.id} article={article} />
        ))}
        {filtered.length === 0 && (
          <div className="text-muted-foreground rounded-xl border border-dashed py-8 text-center text-sm">
            {articles.length === 0
              ? t("components.knowledgeBase.noArticles", "Todavía no hay artículos.")
              : t("components.knowledgeBase.noResults", "Sin resultados.")}
          </div>
        )}
      </div>
    </div>
  );
}
