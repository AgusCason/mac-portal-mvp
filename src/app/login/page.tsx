import { Suspense } from "react";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBranding } from "@/lib/queries/branding";
import { LoginForm } from "./login-form";

// Posiciones/timing fijos (no Math.random() en cada render) — si no, el HTML
// del servidor y el primer render del cliente difieren y React tira un
// hydration mismatch. "Aleatorio" a mano una sola vez alcanza para el efecto.
const STARS = [
  { top: "8%", left: "12%", size: 2, delay: "0s", duration: "3.2s" },
  { top: "15%", left: "82%", size: 1, delay: "0.6s", duration: "2.6s" },
  { top: "22%", left: "34%", size: 1, delay: "1.4s", duration: "3.8s" },
  { top: "12%", left: "58%", size: 2, delay: "2s", duration: "3s" },
  { top: "30%", left: "8%", size: 1, delay: "0.9s", duration: "2.9s" },
  { top: "38%", left: "92%", size: 2, delay: "1.7s", duration: "3.4s" },
  { top: "48%", left: "20%", size: 1, delay: "0.3s", duration: "2.7s" },
  { top: "55%", left: "70%", size: 1, delay: "2.4s", duration: "3.6s" },
  { top: "64%", left: "40%", size: 2, delay: "1.1s", duration: "3.1s" },
  { top: "70%", left: "88%", size: 1, delay: "0.5s", duration: "2.8s" },
  { top: "78%", left: "14%", size: 1, delay: "1.9s", duration: "3.3s" },
  { top: "85%", left: "60%", size: 2, delay: "0.2s", duration: "2.5s" },
  { top: "90%", left: "30%", size: 1, delay: "1.3s", duration: "3.7s" },
  { top: "5%", left: "45%", size: 1, delay: "2.2s", duration: "3s" },
  { top: "60%", left: "5%", size: 1, delay: "0.8s", duration: "2.6s" },
  { top: "40%", left: "50%", size: 1, delay: "1.6s", duration: "3.5s" },
];

const SPARKLES = [
  { top: "18%", left: "80%", size: "size-3", delay: "0s", duration: "9s" },
  { top: "72%", left: "10%", size: "size-2", delay: "1.5s", duration: "11s" },
  { top: "12%", left: "15%", size: "size-2", delay: "3s", duration: "10s" },
];

/**
 * Fondo animado de /login: dos "auroras" de --primary pulsando + campo de
 * estrellas titilando + un par de destellos flotantes (el mismo diamante de
 * la marca). Todo decorativo -> aria-hidden y pointer-events-none, y ningún
 * color suelto: solo --primary/--foreground (branding dinámico, ver
 * layout.tsx) vía las clases bg-primary/text-foreground de siempre.
 * `cosmic-anim` en cada pieza respeta el ajuste de sistema.
 */
function LoginCosmicBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-background absolute inset-0" />
      <div
        className="bg-primary/25 cosmic-anim absolute -top-32 -left-24 size-72 rounded-full blur-3xl sm:size-96"
        style={{ animation: "cosmic-pulse 9s ease-in-out infinite" }}
      />
      <div
        className="bg-primary/15 cosmic-anim absolute -right-24 -bottom-32 size-80 rounded-full blur-3xl sm:size-[26rem]"
        style={{ animation: "cosmic-pulse 11s ease-in-out infinite", animationDelay: "1.5s" }}
      />
      {STARS.map((star, i) => (
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
      ))}
      {SPARKLES.map((sparkle, i) => (
        <span
          key={i}
          className={`bg-primary/50 cosmic-anim absolute ${sparkle.size} rotate-45 rounded-sm`}
          style={{
            top: sparkle.top,
            left: sparkle.left,
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
          <div
            className="bg-primary/10 border-primary/25 cosmic-anim relative inline-flex items-center justify-center rounded-2xl border px-5 py-3.5"
            style={{ animation: "cosmic-badge-glow 3.5s ease-in-out infinite" }}
          >
            {customLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL de logo arbitraria configurada por el admin, no se puede allowlistar en next.config en runtime.
              <img src={customLogoUrl} alt={branding.app_name} className="h-8 w-auto max-w-[160px] object-contain" />
            ) : (
              <Image src="/logo.png" alt={branding.app_name} width={109} height={40} className="h-8 w-auto" />
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
