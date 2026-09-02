import { Suspense } from "react";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBranding } from "@/lib/queries/branding";
import { LoginForm } from "./login-form";

/**
 * El sparkle de 4 puntas del favicon (public/favicon.png) como path — mismo
 * silueta, para poder usarlo chiquito y de color variable (`currentColor`)
 * como "mini estrella" del fondo animado, algo que un <img> del PNG no
 * puede hacer bien a 4-10px. No es un ícono inventado: es el propio ícono de
 * la marca redibujado como vector — ver DESIGN_RULES.md (Lucide para todo lo
 * demás; esta es la excepción explícita, reproducir el propio isotipo).
 */
function BrandSparkle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M12 2 L13.77 10.23 L22 12 L13.77 13.77 L12 22 L10.23 13.77 L2 12 L10.23 10.23 Z" />
    </svg>
  );
}

// Posiciones/timing/tamaños fijos (no Math.random() en cada render) — si no,
// el HTML del servidor y el primer render del cliente difieren y React tira
// un hydration mismatch. "Aleatorio" a mano una sola vez alcanza para el
// efecto. Dos escalas, como en la referencia: muchas estrellitas chicas de
// fondo (`MINI_STARS`, la mayoría puntos simples) y un puñado de sparkles
// grandes flotando más despacio (`DRIFT_SPARKLES`).
const MINI_STARS = [
  { top: "8%", left: "12%", size: 10, delay: "0s", duration: "3.2s", sparkle: true },
  { top: "15%", left: "82%", size: 3, delay: "0.6s", duration: "2.6s" },
  { top: "22%", left: "34%", size: 3, delay: "1.4s", duration: "3.8s" },
  { top: "12%", left: "58%", size: 8, delay: "2s", duration: "3s", sparkle: true },
  { top: "30%", left: "8%", size: 3, delay: "0.9s", duration: "2.9s" },
  { top: "38%", left: "92%", size: 9, delay: "1.7s", duration: "3.4s", sparkle: true },
  { top: "48%", left: "20%", size: 3, delay: "0.3s", duration: "2.7s" },
  { top: "55%", left: "70%", size: 3, delay: "2.4s", duration: "3.6s" },
  { top: "64%", left: "40%", size: 9, delay: "1.1s", duration: "3.1s", sparkle: true },
  { top: "70%", left: "88%", size: 3, delay: "0.5s", duration: "2.8s" },
  { top: "78%", left: "14%", size: 3, delay: "1.9s", duration: "3.3s" },
  { top: "85%", left: "60%", size: 8, delay: "0.2s", duration: "2.5s", sparkle: true },
  { top: "90%", left: "30%", size: 3, delay: "1.3s", duration: "3.7s" },
  { top: "5%", left: "45%", size: 3, delay: "2.2s", duration: "3s" },
  { top: "60%", left: "5%", size: 3, delay: "0.8s", duration: "2.6s" },
  { top: "40%", left: "50%", size: 3, delay: "1.6s", duration: "3.5s" },
  { top: "25%", left: "68%", size: 3, delay: "1.2s", duration: "3s" },
  { top: "45%", left: "12%", size: 3, delay: "0.4s", duration: "2.9s" },
];

const DRIFT_SPARKLES = [
  { top: "16%", left: "80%", size: 34, delay: "0s", duration: "9s" },
  { top: "70%", left: "8%", size: 24, delay: "1.5s", duration: "11s" },
  { top: "10%", left: "13%", size: 20, delay: "3s", duration: "10s" },
];

/**
 * Fondo animado de /login, calcado de la referencia que trajo el usuario:
 * "planeta" con brillo en el horizonte (acá en verde de marca, no violeta),
 * campo de estrellas titilando (una mezcla de puntos simples y mini-sparkles
 * con la silueta del favicon) y un puñado de sparkles grandes flotando.
 * Todo decorativo -> aria-hidden y pointer-events-none, y ningún color
 * suelto: solo --primary/--foreground (branding dinámico, ver layout.tsx).
 * `cosmic-anim` en cada pieza respeta `prefers-reduced-motion`.
 */
function LoginCosmicBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-background absolute inset-0" />

      {/* "Horizonte de planeta": un halo grande y difuso detrás, y encima un
          disco opaco del mismo color de fondo un poco más abajo/chico — el
          borde que asoma entre los dos es el brillo, igual que la curva
          iluminada de la referencia. */}
      <div
        className="bg-primary/70 cosmic-anim absolute left-1/2 size-[140vw] -translate-x-1/2 rounded-full blur-3xl sm:size-[110vw]"
        style={{ top: "72%", animation: "cosmic-pulse 10s ease-in-out infinite" }}
      />
      <div className="bg-background absolute left-1/2 size-[140vw] -translate-x-1/2 rounded-full sm:size-[110vw]" style={{ top: "78%" }} />

      {MINI_STARS.map((star, i) =>
        star.sparkle ? (
          <BrandSparkle
            key={i}
            className="text-primary cosmic-anim absolute"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animation: `cosmic-twinkle ${star.duration} ease-in-out infinite`,
              animationDelay: star.delay,
            }}
          />
        ) : (
          <span
            key={i}
            className="bg-foreground cosmic-anim absolute rounded-full"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animation: `cosmic-twinkle ${star.duration} ease-in-out infinite`,
              animationDelay: star.delay,
            }}
          />
        )
      )}

      {DRIFT_SPARKLES.map((sparkle, i) => (
        <BrandSparkle
          key={i}
          className="text-primary/70 cosmic-anim absolute drop-shadow-[0_0_6px_var(--primary)]"
          style={{
            top: sparkle.top,
            left: sparkle.left,
            width: sparkle.size,
            height: sparkle.size,
            animation: `cosmic-drift ${sparkle.duration} ease-in-out infinite`,
            animationDelay: sparkle.delay,
          }}
        />
      ))}
    </div>
  );
}

export default async function LoginPage() {
  const branding = await getBranding();
  const customLogoUrl = branding.logo_dark_url ?? branding.logo_light_url;

  return (
    // `.dark` fuerza la paleta oscura acá siempre, sin importar el tema del
    // sistema/usuario — la estética "cósmica" no tiene una variante clara
    // pensada (igual que el resto de la app respeta claro/oscuro, esta
    // pantalla puntual no: es la puerta de entrada, antes de que exista
    // ninguna preferencia de usuario cargada).
    <div className="dark bg-background relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <LoginCosmicBackground />

      <Card className="bg-card/60 border-border/60 relative w-full max-w-sm gap-5 rounded-3xl border py-8 shadow-2xl backdrop-blur-xl">
        <CardHeader className="items-center gap-3 text-center">
          {/* Badge "vidrioso" como el de la referencia: degradé diagonal +
              brillo superior (sheen) + anillo que pulsa, todo en --primary. */}
          <div
            className="border-primary/30 from-primary/35 to-primary/5 cosmic-anim relative isolate inline-flex items-center justify-center overflow-hidden rounded-[1.75rem] border bg-gradient-to-br px-6 py-4"
            style={{ animation: "cosmic-badge-glow 3.5s ease-in-out infinite" }}
          >
            <div className="from-foreground/25 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent" />
            {customLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL de logo arbitraria configurada por el admin, no se puede allowlistar en next.config en runtime.
              <img
                src={customLogoUrl}
                alt={branding.app_name}
                className="relative h-8 w-auto max-w-[160px] object-contain"
              />
            ) : (
              <Image
                src="/logo.png"
                alt={branding.app_name}
                width={109}
                height={40}
                className="relative h-8 w-auto"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-foreground text-xl font-semibold">
              Bienvenido a {branding.app_name}
            </CardTitle>
            <CardDescription className="text-muted-foreground mx-auto max-w-[26ch] text-sm">
              Ingresá con tu cuenta de la agencia para ver tus proyectos, contenido y más.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* useSearchParams (para leer ?next=) requiere un boundary de Suspense
              en App Router — si no, Next.js falla el build en el prerender. */}
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
