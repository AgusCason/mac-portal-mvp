"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { loginAction, verifyMfaAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Overlay breve "verificando" mientras loginAction (o el 2° paso de 2FA)
 * están en curso — pedido explícito además del rediseño: el login ya tarda
 * poco (ver optimizaciones en loginAction), pero un estado vacío de "nada
 * pasa" durante esos ~1-2s se siente más pesado que mostrar qué está
 * pasando. Se re-monta con `key` en cada submit para que la animación de
 * entrada corra de nuevo si el usuario reintenta.
 */
function VerifyingOverlay({ message }: { message: string }) {
  return (
    <div className="bg-card/90 animate-in fade-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-3xl backdrop-blur-sm duration-200">
      <div className="bg-primary/10 border-primary/25 flex size-14 items-center justify-center rounded-2xl border">
        <Loader2 className="text-primary size-6 animate-spin" />
      </div>
      <p className="text-foreground text-sm font-medium">{message}</p>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 2 (opcional): si la cuenta tiene verificación en dos pasos
  // verificada, Supabase Auth exige un segundo factor (AAL2) ANTES de que la
  // sesión ya creada por signInWithPassword sirva para algo — esto lo decide
  // Supabase por cuenta, no nuestro flag de Configuración > Módulos (ese
  // flag solo controla si alguien puede EMPEZAR a activarlo desde Mi Perfil,
  // nunca desactiva retroactivamente a quien ya lo tiene andando). Si hace
  // falta, loginAction ya lo resuelve del lado del servidor y devuelve
  // `mfaFactorId` directo — ver src/app/actions/auth.ts.
  const [awaitingMfa, setAwaitingMfa] = useState<{ factorId: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [nextPath, setNextPath] = useState<string | null>(null);

  function goToNext() {
    router.replace(nextPath ?? "/dashboard");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // El login pasa por un Server Action (loginAction) en vez de llamar a
    // Supabase Auth directo desde el browser, para poder rate-limitar los
    // intentos fallidos del lado del servidor — ver src/app/actions/auth.ts.
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    const result = await loginAction(formData);

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Si vino de un link a una página puntual (?next=), respeta eso. Si no,
    // va directo a la home del rol en vez de a "/dashboard" — ese path no es
    // una página real, existe solo para que proxy.ts la redirija a la home
    // del rol, así que ir directo ahorra una vuelta completa de más por el
    // servidor (con su propio middleware) en CADA login.
    //
    // OJO: acá abajo se usa la variable LOCAL `resolvedNext`, no el estado
    // `nextPath` — `setNextPath` recién arriba no actualizó todavía ese
    // estado en este mismo render (setState es asíncrono), así que navegar
    // con el estado en este punto siempre terminaba cayendo al fallback
    // "/dashboard" pese al comentario de arriba, el extra viaje por el
    // servidor que se supone que esto evita. `nextPath` (estado) sigue
    // existiendo para que `goToNext()` lo use en el paso de 2FA, un ciclo de
    // render distinto donde sí ya está actualizado.
    const resolvedNext = searchParams.get("next") ?? (result.role ? `/${result.role}` : "/dashboard");
    setNextPath(resolvedNext);

    if (result.mfaFactorId) {
      setLoading(false);
      setAwaitingMfa({ factorId: result.mfaFactorId });
      return;
    }

    setLoading(false);
    router.replace(resolvedNext);
    router.refresh();
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!awaitingMfa) return;
    setLoading(true);
    setError(null);

    const result = await verifyMfaAction(awaitingMfa.factorId, mfaCode);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    goToNext();
  }

  if (awaitingMfa) {
    return (
      <form onSubmit={handleMfaSubmit} className="relative space-y-4">
        {loading && <VerifyingOverlay message="Verificando código..." />}
        <div className="space-y-1.5">
          <Label htmlFor="mfaCode" className="text-foreground">
            <ShieldCheck className="text-primary size-3.5" /> Código de verificación
          </Label>
          <Input
            id="mfaCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            autoFocus
            required
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            className="login-glass-input text-foreground placeholder:text-muted-foreground/60 h-12 rounded-xl border-transparent bg-transparent text-center text-lg tracking-[0.3em] focus-visible:border-transparent focus-visible:ring-0"
          />
          <p className="text-muted-foreground text-xs">
            Abrí tu app de autenticación (Google Authenticator, Authy, etc.) e ingresá el código de 6 dígitos.
          </p>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button
          type="submit"
          className="login-cta text-primary-foreground h-12 w-full rounded-xl transition-transform hover:-translate-y-0.5 hover:shadow-none active:translate-y-0"
          disabled={loading}
        >
          {loading && <Loader2 className="animate-spin" />}
          Verificar
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4">
      {loading && <VerifyingOverlay message="Verificando tus datos..." />}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-foreground">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-glass-input text-foreground placeholder:text-muted-foreground/60 h-12 rounded-xl border-transparent bg-transparent focus-visible:border-transparent focus-visible:ring-0"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-foreground">
            Contraseña
          </Label>
          <Link href="/login/olvide-password" className="text-muted-foreground hover:text-primary text-xs">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Ingresá tu contraseña"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-glass-input text-foreground placeholder:text-muted-foreground/60 h-12 rounded-xl border-transparent bg-transparent focus-visible:border-transparent focus-visible:ring-0"
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button
        type="submit"
        className="login-cta text-primary-foreground h-12 w-full gap-2 rounded-xl transition-transform hover:-translate-y-0.5 hover:shadow-none active:translate-y-0"
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Ingresar
      </Button>
    </form>
  );
}
