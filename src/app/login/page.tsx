import { Suspense } from "react";

import { getBranding } from "@/lib/queries/branding";
import { LoginForm } from "./login-form";

/**
 * El sparkle de 4 puntas del favicon (public/favicon.png) como path — mismo
 * silueta, para poder usarlo chiquito y de color variable (`currentColor`)
 * como "mini estrella" del fondo animado, o grande en el badge central. No
 * es un ícono inventado: es el propio isotipo de la marca redibujado como
 * vector — ver DESIGN_RULES.md (Lucide para todo lo demás; esta es la
 * excepción explícita, reproducir el propio isotipo).
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
// un hydration mismatch.
const MINI_STARS = [
  { top: "10%", left: "16%", size: 3, delay: "0s", duration: "3.2s" },
  { top: "18%", left: "78%", size: 3, delay: "0.6s", duration: "2.6s" },
  { top: "26%", left: "38%", size: 8, delay: "1.4s", duration: "3.8s", sparkle: true },
  { top: "14%", left: "55%", size: 3, delay: "2s", duration: "3s" },
  { top: "34%", left: "10%", size: 3, delay: "0.9s", duration: "2.9s" },
  { top: "40%", left: "90%", size: 3, delay: "1.7s", duration: "3.4s" },
  { top: "50%", left: "22%", size: 8, delay: "0.3s", duration: "2.7s", sparkle: true },
  { top: "58%", left: "68%", size: 3, delay: "2.4s", duration: "3.6s" },
  { top: "68%", left: "42%", size: 3, delay: "1.1s", duration: "3.1s" },
  { top: "74%", left: "86%", size: 3, delay: "0.5s", duration: "2.8s" },
  { top: "82%", left: "18%", size: 3, delay: "1.9s", duration: "3.3s" },
  { top: "88%", left: "58%", size: 8, delay: "0.2s", duration: "2.5s", sparkle: true },
  { top: "6%", left: "42%", size: 3, delay: "2.2s", duration: "3s" },
  { top: "64%", left: "6%", size: 3, delay: "0.8s", duration: "2.6s" },
];

// Los dos destellos grandes "flotando libremente a la izquierda y derecha
// del panel" de la referencia — cada uno con su propio halo (glow) detrás,
// no solo un ícono plano.
const FLANKING_SPARKLES = [
  { top: "38%", left: "9%", size: 30, glow: 90, delay: "0s", duration: "8s" },
  { top: "60%", left: "88%", size: 24, glow: 76, delay: "1.2s", duration: "9s" },
];

/**
 * Fondo animado de /login: espacio profundo con un horizonte de planeta MUY
 * sutil (la referencia lo tiene apenas insinuado, no como protagonista — la
 * luz principal tiene que salir del panel/badge, no del planeta), campo de
 * estrellas chicas (puntos + mini-sparkles con la silueta del favicon) y dos
 * sparkles grandes con halo propio flanqueando la tarjeta. Todo decorativo
 * -> aria-hidden y pointer-events-none, y ningún color suelto: solo
 * --primary/--foreground (branding dinámico, ver layout.tsx). `cosmic-anim`
 * en cada pieza respeta `prefers-reduced-motion`.
 */
function LoginCosmicBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-background absolute inset-0" />

      {/* Horizonte de planeta, apenas insinuado — halo chico y tenue pegado
          al borde inferior, no una banda de luz dominante. */}
      <div
        className="bg-primary/25 cosmic-anim absolute left-1/2 size-[120vw] -translate-x-1/2 rounded-full blur-3xl"
        style={{ top: "97%", animation: "cosmic-pulse 12s ease-in-out infinite" }}
      />
      <div className="bg-background absolute left-1/2 size-[120vw] -translate-x-1/2 rounded-full" style={{ top: "101%" }} />

      {MINI_STARS.map((star, i) =>
        star.sparkle ? (
          <BrandSparkle
            key={i}
            className="text-primary/80 cosmic-anim absolute"
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

      {FLANKING_SPARKLES.map((sparkle, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: sparkle.top, left: sparkle.left }}
        >
          <div
            className="bg-primary cosmic-anim absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-xl"
            style={{
              width: sparkle.glow,
              height: sparkle.glow,
              animation: `cosmic-pulse ${sparkle.duration} ease-in-out infinite`,
              animationDelay: sparkle.delay,
            }}
          />
          <BrandSparkle
            className="text-foreground cosmic-anim relative"
            style={{
              width: sparkle.size,
              height: sparkle.size,
              animation: `cosmic-drift ${sparkle.duration} ease-in-out infinite`,
              animationDelay: sparkle.delay,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default async function LoginPage() {
  const branding = await getBranding();
  // Blanco-etiqueta: si el admin subió un logo propio (Configuración > Marca)
  // va adentro de la esfera de vidrio en vez del sparkle de marca por
  // defecto — la esfera/glow es el TRATAMIENTO, el contenido lo decide el
  // branding configurado, igual que en el resto de la app.
  const customLogoUrl = branding.logo_dark_url ?? branding.logo_light_url;

  return (
    // `.dark` fuerza la paleta oscura acá siempre, sin importar el tema del
    // sistema/usuario — la estética "cósmica" no tiene una variante clara
    // pensada (igual que el resto de la app respeta claro/oscuro, esta
    // pantalla puntual no: es la puerta de entrada, antes de que exista
    // ninguna preferencia de usuario cargada).
    <div className="dark bg-background relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <LoginCosmicBackground />

      {/* .login-shell/.login-panel (globals.css): el "borde" es un degradé de
          1px de padding detrás de un panel opaco encima, no un border sólido
          — así el filo brilla con su propio gradiente de marca en vez de un
          color plano. Este es el tratamiento que reemplazó al <Card/> simple
          de la v3 tras el feedback de "muy 2D, muy pobre": se armó iterando
          directo en v0 (ver charla) hasta encontrar esta combinación de
          capas. */}
      <section aria-labelledby="login-title" className="login-shell relative z-10 w-full max-w-sm rounded-[28px] p-px">
        <div className="login-panel relative rounded-[27px] px-6 pb-8 pt-0 sm:px-9 sm:pb-9">
          {/* Halo pulsante detrás de la esfera — mismo keyframe que ya
              respeta prefers-reduced-motion vía .cosmic-anim. */}
          <div
            aria-hidden="true"
            className="login-orb-halo cosmic-anim absolute left-1/2 top-0 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ animation: "cosmic-badge-glow 3.5s ease-in-out infinite" }}
          />

          {/* Esfera de vidrio: degradé radial simulando una luz pegándole a
              una esfera + sombras internas de volumen + un brillo (sheen)
              ovalado (::after en .login-orb, ver globals.css). */}
          <div className="login-orb relative mx-auto flex size-20 -translate-y-1/2 items-center justify-center rounded-full shadow-lg">
            {customLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL de logo arbitraria configurada por el admin, no se puede allowlistar en next.config en runtime.
              <img src={customLogoUrl} alt={branding.app_name} className="relative z-10 size-11 rounded-full object-cover" />
            ) : (
              <BrandSparkle
                className="relative z-10 size-9"
                style={{ color: "color-mix(in oklch, var(--primary-foreground) 85%, black)" }}
              />
            )}
          </div>

          <div className="-mt-4 text-center">
            <p className="text-primary/80 mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.35em]">
              {branding.app_name} · Acceso privado
            </p>
            <h1 id="login-title" className="text-foreground text-balance text-[26px] font-semibold tracking-tight sm:text-[28px]">
              Bienvenido a {branding.app_name}
            </h1>
            <p className="text-muted-foreground mx-auto mt-3 max-w-[28ch] text-pretty text-sm leading-6">
              Ingresá con tu cuenta de la agencia para ver tus proyectos, contenido y más.
            </p>
          </div>

          <div className="mt-7">
            {/* useSearchParams (para leer ?next=) requiere un boundary de
                Suspense en App Router — si no, Next.js falla el build en el
                prerender. */}
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="text-muted-foreground/45 mt-7 text-center font-mono text-[9px] uppercase tracking-[0.22em]">
            Acceso exclusivo para clientes y equipo {branding.app_name}
          </p>
        </div>
      </section>
    </div>
  );
}
