"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentBoard } from "@/components/content/content-board";
import { NewContentDialog } from "@/components/content/new-content-dialog";
import { MediaLibraryView } from "@/components/media-library/media-library-view";
import { NETWORK_META } from "@/lib/network-meta";
import { formatDate } from "@/lib/utils";
import type { ContentItemWithClient } from "@/lib/queries/content";
import type { MediaAssetWithRelations, MediaFolderWithCount } from "@/lib/queries/media-library";

export function PlannerView({
  items,
  clients,
  folders,
  assets,
}: {
  items: ContentItemWithClient[];
  clients: { id: string; name: string }[];
  folders: MediaFolderWithCount[];
  assets: MediaAssetWithRelations[];
}) {
  const published = items.filter((i) => i.status === "publicado");
  const igGrid = items.filter((i) => i.network === "instagram_feed");

  return (
    <Tabs defaultValue="planner" className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="planner">Planner</TabsTrigger>
          <TabsTrigger value="publicados">Publicados</TabsTrigger>
          <TabsTrigger value="grilla-ig">Grilla IG</TabsTrigger>
          <TabsTrigger value="media">Media Library</TabsTrigger>
        </TabsList>
        <NewContentDialog clients={clients} />
      </div>

      <TabsContent value="planner">
        <ContentBoard items={items} role="admin" />
      </TabsContent>

      <TabsContent value="publicados">
        <div className="space-y-2">
          {published.length === 0 && (
            <p className="text-muted-foreground rounded-xl border border-dashed py-8 text-center text-sm">
              Todavía no hay piezas publicadas.
            </p>
          )}
          {published.map((item) => {
            const network = NETWORK_META[item.network];
            return (
              <div key={item.id} className="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
                    <network.icon className="size-3" /> {network.label} · {item.client_name}
                  </p>
                </div>
                {item.scheduled_at && (
                  <span className="text-muted-foreground shrink-0 text-xs">{formatDate(item.scheduled_at)}</span>
                )}
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="grilla-ig">
        {igGrid.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed py-8 text-center text-sm">
            No hay piezas de Instagram Feed todavía.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-6">
            {igGrid.map((item) => (
              <div key={item.id} className="bg-muted relative aspect-square overflow-hidden rounded-sm">
                {item.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail_url} alt={item.title} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <ImageOff className="text-muted-foreground size-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="media">
        <MediaLibraryView folders={folders} assets={assets} clients={clients} />
      </TabsContent>
    </Tabs>
  );
}
