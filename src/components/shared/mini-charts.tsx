import { cn } from "@/lib/utils";

/**
 * Mini-charts reusables — para meter "un gráfico real" donde antes había
 * solo un número suelto (pedido explícito: sparkline en Facturación, donut
 * en mix de estados/planes, ring en KPIs con una proporción real), sin
 * duplicar la matemática de SVG en cada página que los use. Sin
 * interacción/tooltip a propósito: son un vistazo rápido de una card, no un
 * chart para analizar — para eso ya existe Analytics > Explorer y los
 * charts de Analytics Overview (`overview-charts.tsx`, con hover real).
 * Nunca inventan una proporción que no exista en los datos reales: si no
 * hay un "sobre cuánto" honesto para un valor, no se le pone un ring.
 */

/** Línea de tendencia chica en SVG puro — sin ejes ni tooltip. */
export function Sparkline({
  points,
  width = 280,
  height = 36,
  color = "var(--primary)",
  className,
}: {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  // Padding vertical chico para que el trazo no quede pegado/cortado en el
  // borde superior o inferior cuando un punto toca el máximo o el mínimo.
  const pad = height * 0.12;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;
  const coords = points
    .map((p, i) => {
      const x = i * stepX;
      const y = height - pad - ((p - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className={cn("block", className)}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/** Donut multi-segmento genérico — mismo patrón que ya usaba
 * `AccountsHeroCard` en el Dashboard, pero reusable para cualquier mix
 * (estados de cuenta, planes, lo que sea) sin repetir la matemática de
 * `strokeDasharray`/`strokeDashoffset` en cada card nueva. */
export function DonutMini({
  segments,
  size = 140,
  strokeWidth = 14,
  centerValue,
  centerLabel,
  className,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string | number;
  centerLabel?: string;
  className?: string;
}) {
  const r = size / 2 - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const { arcs } = segments.filter((s) => s.value > 0).reduce<{
    arcs: { label: string; color: string; length: number; offset: number }[];
    cumulative: number;
  }>(
    (acc, s) => {
      const fraction = total > 0 ? s.value / total : 0;
      const length = fraction * circumference;
      return {
        arcs: [...acc.arcs, { label: s.label, color: s.color, length, offset: -acc.cumulative }],
        cumulative: acc.cumulative + length,
      };
    },
    { arcs: [], cumulative: 0 }
  );

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        {arcs.map((a) => (
          <circle
            key={a.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${a.length} ${circumference}`}
            strokeDashoffset={a.offset}
            strokeLinecap="round"
          />
        ))}
      </svg>
      {(centerValue !== undefined || centerLabel) && (
        <div className="bg-card absolute inset-[14%] flex flex-col items-center justify-center rounded-full">
          {centerValue !== undefined && (
            <strong className="text-2xl font-extrabold tracking-tighter">{centerValue}</strong>
          )}
          {centerLabel && (
            <span className="text-muted-foreground text-center text-[9px] font-semibold tracking-wide uppercase">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** Ring chico de una sola proporción (valor / máximo) — para KPIs donde SÍ
 * hay un "sobre cuánto" real y honesto (ej. contenido en curso sobre el
 * total del pipeline). No usar con un `max` inventado. */
export function ProgressRing({
  value,
  max,
  size = 56,
  strokeWidth = 7,
  color = "var(--info)",
  displayValue,
  className,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  /** Texto a mostrar en el centro — por defecto, `value`. */
  displayValue?: string | number;
  className?: string;
}) {
  const r = size / 2 - strokeWidth / 2 - 1;
  const circumference = 2 * Math.PI * r;
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const length = pct * circumference;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${length} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold tabular-nums">
        {displayValue ?? value}
      </div>
    </div>
  );
}
