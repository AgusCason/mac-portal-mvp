"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

import type { AppNotification } from "@/types/database";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

function NotificationRow({ notification }: { notification: AppNotification }) {
  const { locale } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const unread = !notification.read_at;
  const dateLocale = locale === "en" ? enUS : es;

  function open() {
    if (unread) {
      startTransition(async () => {
        await markNotificationReadAction(notification.id);
        router.refresh();
      });
    }
  }

  const content = (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150",
        unread ? "border-primary/30 bg-primary/5" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{notification.title}</p>
        {unread && <span className="bg-primary mt-1 size-1.5 shrink-0 rounded-full" />}
      </div>
      {notification.body && (
        <p className="text-muted-foreground mt-0.5 text-xs">{notification.body}</p>
      )}
      <p className="text-muted-foreground mt-1 text-[11px]">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dateLocale })}
      </p>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={open} className="block" aria-disabled={isPending}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={open} className="block w-full text-left" disabled={isPending}>
      {content}
    </button>
  );
}

/**
 * Panel deslizante "Notificaciones" — menciones/eventos relevantes para el
 * usuario logueado (campana del navbar, equivalente al de MB Suite).
 */
export function NotificationsPanel({
  notificationsPromise,
  unreadCountPromise,
}: {
  notificationsPromise: Promise<AppNotification[]>;
  unreadCountPromise: Promise<number>;
}) {
  // `use()` desenvuelve las promesas acá adentro, dentro del <Suspense> que
  // pone AppShell — así esta consulta no bloquea el resto del shell/página
  // mientras está en vuelo (ver app-shell.tsx).
  const notifications = use(notificationsPromise);
  const unreadCount = use(unreadCountPromise);
  const { t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("components.shared.sectionNotifications", "Notificaciones")} className="relative">
          <Bell />
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("components.shared.sectionNotifications", "Notificaciones")}</SheetTitle>
          <SheetDescription>{t("components.shared.notificationsPanelDesc", "Menciones, aprobaciones y avisos importantes.")}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 px-6">
          <div className="flex flex-col gap-2 pb-6">
            {notifications.length === 0 && (
              <p className="text-muted-foreground text-sm">{t("components.shared.noNotifications", "No tenés notificaciones.")}</p>
            )}
            {notifications.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </div>
        </ScrollArea>
        {unreadCount > 0 && (
          <SheetFooter>
            <Button variant="outline" size="sm" onClick={markAll} disabled={isPending}>
              <CheckCheck /> {t("components.shared.markAllRead", "Marcar todas como leídas")}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
