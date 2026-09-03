"use client";

import Link from "next/link";
import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Star, Camera, ThumbsUp, Video, Globe, Music2 } from "lucide-react";

import { toggleClientFavoriteAction } from "@/app/actions/clients";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import type { AccountCardData, AccountPlatform } from "@/lib/queries/clients";

const PLATFORM_ICON: Record<AccountPlatform["key"], React.ElementType> = {
  instagram: Camera,
  tiktok: Music2,
  facebook: ThumbsUp,
  youtube: Video,
  website: Globe,
};

/**
 * Tarjeta de Cuenta estilo MB Suite (`/demo-agency/accounts`): logo, estado
 * de suscripción, equipo asignado (avatares superpuestos) y plataformas
 * conectadas — todo con datos reales de Supabase. Reemplaza la fila de tabla
 * que tenía la vieja sección "Clientes".
 */
export function AccountCard({ account }: { account: AccountCardData }) {
  const { t } = useLocale();
  const [isFavorite, setIsFavorite] = React.useState(account.isFavorite);
  const [isPending, startTransition] = useTransition();

  const STATUS_LABEL: Record<string, string> = {
    active: t("components.clients.statusActive", "Activa"),
    paused: t("components.clients.statusPaused", "Pausada"),
    churned: t("components.clients.statusChurned", "Perdida"),
  };

  function handleToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);
    startTransition(async () => {
      const res = await toggleClientFavoriteAction(account.id, next);
      if (!res.ok) {
        setIsFavorite(!next);
        toast.error(res.error);
      }
    });
  }

  const visibleTeam = account.team.slice(0, 3);
  const overflowTeam = account.team.length - visibleTeam.length;

  return (
    <Link
      href={`/admin/clientes/${account.id}`}
      className="glass-card group flex flex-col gap-3 rounded-2xl p-4 transition-colors duration-150 hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-2">
        <Avatar className="border-border size-11 rounded-xl border">
          <AvatarImage src={account.logoUrl ?? undefined} alt={account.name} />
          <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(account.name)}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={isPending}
          aria-label={
            isFavorite
              ? t("components.clients.removeFavorite", "Quitar de favoritos")
              : t("components.clients.addFavorite", "Marcar como favorito")
          }
          className="rounded-md p-1 text-muted-foreground/60 opacity-0 transition-opacity hover:text-warning group-hover:opacity-100 data-[active=true]:opacity-100 data-[active=true]:text-warning"
          data-active={isFavorite}
        >
          <Star className={cn("size-4", isFavorite && "fill-current")} />
        </button>
      </div>

      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-semibold">{account.name}</p>
        <div className="flex items-center gap-1.5">
          <Badge variant={account.status === "active" ? "success" : "secondary"} className="text-[10px]">
            {STATUS_LABEL[account.status]}
          </Badge>
          <Badge variant={account.planName ? "info" : "outline"} className="text-[10px]">
            {account.planName
              ? `${t("components.clients.withSubscriptionPrefix", "Con suscripción —")} ${account.planName}`
              : t("components.clients.internal", "Interna")}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex -space-x-2">
          {visibleTeam.length === 0 && (
            <span className="text-xs text-muted-foreground">
              {t("components.clients.noTeamAssigned", "Sin equipo asignado")}
            </span>
          )}
          {visibleTeam.map((member) => (
            <Avatar key={member.id} className="size-6 border-2 border-card">
              <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />
              <AvatarFallback className="text-[10px]">{getInitials(member.name)}</AvatarFallback>
            </Avatar>
          ))}
          {overflowTeam > 0 && (
            <div className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium">
              +{overflowTeam}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          {account.platforms.length === 0 && (
            <span className="text-xs text-muted-foreground/70">
              {t("components.clients.noSocialAccounts", "Sin redes cargadas")}
            </span>
          )}
          {account.platforms.map((platform) => {
            const Icon = PLATFORM_ICON[platform.key];
            return <Icon key={platform.key} className="size-3.5" />;
          })}
        </div>
      </div>
    </Link>
  );
}
