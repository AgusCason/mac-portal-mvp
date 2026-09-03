"use client";

import * as React from "react";
import { Table2, LayoutGrid } from "lucide-react";

import type { ReachTrendPoint, PlatformDashboard } from "@/lib/queries/analytics";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCompactNumber, formatDate, niceScaleMax } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/dictionary";
import type { SocialPlatform } from "@/types/database";

const DATE_LOCALE: Record<Locale, string> = { es: "es-AR", en: "en-US" };

/** Color fijo por plataforma — nunca ciclado, mismo orden en todos los gráficos de Analytics. */
export const PLATFORM_COLOR: Record<SocialPlatform, string> = {
  instagram: "var(--platform-instagram)",
  tiktok: "var(--platform-tiktok)",
  youtube: "var(--platform-youtube)",
};

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

/**
 * Alcance — tendencia diaria (últimos N días), no un número suelto. Serie
 * única de magnitud: un solo color (`--info`), sin necesitar leyenda (el
 * título ya nombra la serie). Área + línea en SVG con hover (crosshair +
 * tooltip), igual criterio de interacción que los charts de Facturación.
 */
export function ReachTrendChart({ data }: { data: ReachTrendPoint[] }) {
  const { t, locale } = useLocale();
  const [showTable, setShowTable] = React.useState(false);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  const W = 560;
  const H = 160;
  const PAD_L = 8;
  const PAD_R = 8;
  const PAD_T = 10;
  const PAD_B = 22;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const max = niceScaleMax(Math.max(...data.map((d) => d.reach), 1));
  const n = Math.max(data.length - 1, 1);
  const x = (i: number) => PAD_L + (i / n) * plotW;
  const y = (v: number) => PAD_T + plotH - (v / max) * plotH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.reach)}`).join(" ");
  const areaPath = `${linePath} L ${x(data.length - 1)} ${PAD_T + plotH} L ${x(0)} ${PAD_T + plotH} Z`;

  const hasData = data.some((d) => d.reach > 0);
  const dateFmt = new Intl.DateTimeFormat(DATE_LOCALE[locale], { day: "2-digit", month: "short" });
  // Etiquetas del eje X: solo primero, medio y último — el resto se
  // amontonaría en un rango de ~14 días.
  const labelIdx = new Set([0, Math.floor(n / 2), n]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => setShowTable((v) => !v)}>
          {showTable ? <LayoutGrid /> : <Table2 />}
          {showTable ? t("billing.viewChart", "Ver gráfico") : t("billing.viewTable", "Ver tabla")}
        </Button>
      </div>

      {!hasData ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {t("pages.analyticsOverview.noReachData", "Todavía no hay alcance cargado en este período.")}
        </p>
      ) : showTable ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages.analyticsExplorer.date", "Fecha")}</TableHead>
                <TableHead className="text-right">{t("pages.analyticsOverview.totalReach", "Alcance total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.date}>
                  <TableCell className="text-muted-foreground">{formatDate(d.date)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {d.reach.toLocaleString("es-AR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
            {/* Gridlines horizontales, recesivas */}
            {[0, 0.5, 1].map((f) => (
              <line
                key={f}
                x1={PAD_L}
                x2={W - PAD_R}
                y1={PAD_T + plotH * (1 - f)}
                y2={PAD_T + plotH * (1 - f)}
                stroke="var(--border)"
                strokeWidth={1}
              />
            ))}
            <path d={areaPath} fill="var(--info)" opacity={0.14} stroke="none" />
            <path d={linePath} fill="none" stroke="var(--info)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {data.map((d, i) => (
              <g key={d.date}>
                <line
                  x1={x(i)}
                  x2={x(i)}
                  y1={PAD_T}
                  y2={PAD_T + plotH}
                  stroke="var(--border)"
                  strokeWidth={hoverIdx === i ? 1 : 0}
                />
                <circle cx={x(i)} cy={y(d.reach)} r={hoverIdx === i ? 3.5 : 0} fill="var(--info)" />
                <rect
                  x={x(i) - plotW / (2 * n)}
                  y={PAD_T}
                  width={plotW / n}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
                {labelIdx.has(i) && (
                  <text x={x(i)} y={H - 4} fontSize={10} textAnchor="middle" fill="var(--muted-foreground)">
                    {dateFmt.format(new Date(d.date))}
                  </text>
                )}
              </g>
            ))}
          </svg>
          {hoverIdx !== null && (
            <div
              className="border-border bg-popover text-popover-foreground pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border px-2.5 py-1.5 text-xs whitespace-nowrap shadow-sm"
              style={{
                left: `${(x(hoverIdx) / W) * 100}%`,
                top: 0,
              }}
            >
              <p className="font-medium">{formatDate(data[hoverIdx].date)}</p>
              <p className="tabular-nums">{data[hoverIdx].reach.toLocaleString("es-AR")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Seguidores por plataforma — torta con porcentajes (`conic-gradient`, sin
 * librerías). Categórico por identidad de plataforma (color fijo, nunca
 * ciclado), leyenda siempre presente con dot + label + valor + %.
 */
export function FollowersDonutChart({ data }: { data: PlatformDashboard[] }) {
  const { t } = useLocale();
  const total = data.reduce((sum, d) => sum + d.totalFollowers, 0);

  if (total === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t("pages.analyticsOverview.noFollowersData", "Todavía no hay seguidores cargados.")}
      </p>
    );
  }

  const segments = data
    .filter((d) => d.totalFollowers > 0)
    .reduce<{ platform: SocialPlatform; followers: number; pct: number; start: number; end: number }[]>(
      (list, d) => {
        const pct = d.totalFollowers / total;
        const prevEndFraction = list.length ? list[list.length - 1].end / 360 : 0;
        const start = prevEndFraction * 360;
        const end = (prevEndFraction + pct) * 360;
        return [...list, { platform: d.platform, followers: d.totalFollowers, pct, start, end }];
      },
      []
    );

  const gradient = segments
    .map((s) => `${PLATFORM_COLOR[s.platform]} ${s.start}deg ${s.end}deg`)
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <div
        className="relative size-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        role="img"
        aria-label={t("pages.analyticsOverview.followersByPlatformAria", "Seguidores por plataforma")}
      >
        <div className="bg-card absolute inset-3 flex flex-col items-center justify-center rounded-full">
          <span className="text-lg font-semibold tabular-nums">{formatCompactNumber(total)}</span>
          <span className="text-muted-foreground text-[10px]">{t("pages.redes.followers", "Seguidores")}</span>
        </div>
      </div>
      <div className="w-full max-w-56 space-y-1.5">
        {segments.map((s) => (
          <div key={s.platform} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: PLATFORM_COLOR[s.platform] }} />
            <span className="min-w-0 flex-1 truncate">{PLATFORM_LABEL[s.platform]}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums text-xs">
              {s.followers.toLocaleString("es-AR")}
            </span>
            <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums">
              {Math.round(s.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Engagement promedio por plataforma — barras horizontales (mismo patrón que
 * PaymentMethodChart): color fijo por plataforma, hover con tooltip, valor
 * siempre visible al lado sin necesitar el hover.
 */
export function EngagementBarChart({ data }: { data: PlatformDashboard[] }) {
  const { t } = useLocale();
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const rows = data.filter((d) => d.accountCount > 0);
  const max = Math.max(...rows.map((d) => d.avgEngagementRate), 1);

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t("pages.analyticsOverview.noEngagementData", "Todavía no hay engagement cargado.")}
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {rows.map((d, i) => (
        <div key={d.platform} className="flex items-center gap-3">
          <span className="text-muted-foreground w-16 shrink-0 truncate text-xs">{PLATFORM_LABEL[d.platform]}</span>
          <div className="relative min-w-0 flex-1">
            <div
              tabIndex={0}
              aria-label={`${PLATFORM_LABEL[d.platform]}: ${d.avgEngagementRate.toFixed(2)}%`}
              className={cn(
                "h-4 rounded-r-[4px] outline-none transition-opacity",
                hoverIdx !== null && hoverIdx !== i && "opacity-60"
              )}
              style={{ width: `${Math.max((d.avgEngagementRate / max) * 100, 2)}%`, background: PLATFORM_COLOR[d.platform] }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onFocus={() => setHoverIdx(i)}
              onBlur={() => setHoverIdx(null)}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">
            {d.avgEngagementRate.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}
