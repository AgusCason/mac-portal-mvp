"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Eye, EyeOff, Copy, Loader2, Wrench } from "lucide-react";

import type { EditorToolCard } from "@/lib/queries/tools";
import { revealToolPasswordAction } from "@/app/actions/tools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useLocale } from "@/lib/i18n/locale-context";

function RevealPasswordButton({ toolId }: { toolId: string }) {
  const { t } = useLocale();
  const [password, setPassword] = React.useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (password) {
      setPassword(null);
      return;
    }
    startTransition(async () => {
      const res = await revealToolPasswordAction(toolId);
      if (res.ok) {
        setPassword(res.password);
      } else {
        toast.error(res.error);
      }
    });
  }

  async function copy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      toast.success(t("components.tools.copiedToClipboard", "Copiado al portapapeles"));
    } catch {
      toast.error(t("components.tools.copyFailed", "No se pudo copiar"));
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button size="sm" variant="outline" onClick={toggle} disabled={isPending} className="w-full justify-center">
        {isPending ? (
          <Loader2 className="animate-spin" />
        ) : password ? (
          <EyeOff className="size-3.5" />
        ) : (
          <Eye className="size-3.5" />
        )}
        {password ? t("components.tools.hidePassword", "Ocultar contraseña") : t("components.tools.showPassword", "Ver contraseña")}
      </Button>
      {password && (
        <>
          <code className="bg-muted rounded px-2 py-1 text-xs">{password}</code>
          <Button size="icon" variant="ghost" onClick={copy} aria-label={t("components.tools.copyAria", "Copiar contraseña")}>
            <Copy className="size-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

function CopyEmailButton({ email }: { email: string }) {
  const { t } = useLocale();

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      toast.success(t("components.tools.copiedToClipboard", "Copiado al portapapeles"));
    } catch {
      toast.error(t("components.tools.copyFailed", "No se pudo copiar"));
    }
  }

  return (
    <Button size="icon" variant="ghost" onClick={copy} aria-label={t("components.tools.copyEmailAria", "Copiar mail")} className="size-6">
      <Copy className="size-3.5" />
    </Button>
  );
}

/** Herramientas compartidas con el editor (/editor/herramientas) — solo lo que necesita para usarlas. */
export function MyToolsGrid({ tools }: { tools: EditorToolCard[] }) {
  const { t } = useLocale();

  if (tools.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title={t("pages.editorHerramientas.noTools", "Todavía no te compartieron ninguna herramienta.")}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <Card key={tool.id} className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{tool.name}</span>
              {tool.url && (
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label={t("components.tools.openLink", "abrir")}
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tool.purpose && <p className="text-muted-foreground text-xs">{tool.purpose}</p>}
            {tool.accountEmail && (
              <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                  {t("components.tools.accountEmailLabel", "Mail de la cuenta")}
                </p>
                <div className="flex items-center gap-1">
                  <p className="min-w-0 flex-1 truncate text-sm">{tool.accountEmail}</p>
                  <CopyEmailButton email={tool.accountEmail} />
                </div>
              </div>
            )}
            {tool.hasPassword ? (
              <RevealPasswordButton toolId={tool.id} />
            ) : (
              <p className="text-muted-foreground text-xs">{t("components.tools.noPassword", "Sin guardar")}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
