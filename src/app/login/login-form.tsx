"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { loginAction } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  // nunca desactiva retroactivamente a quien ya lo tiene andando).
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
    setNextPath(searchParams.get("next") ?? (result.role ? `/${result.role}` : "/dashboard"));

    const supabase = createClient();
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factorId = factors?.totp.find((f) => f.status === "verified")?.id;
      if (factorId) {
        setLoading(false);
        setAwaitingMfa({ factorId });
        return;
      }
    }

    setLoading(false);
    goToNext();
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!awaitingMfa) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: awaitingMfa.factorId,
      code: mfaCode.trim(),
    });
    setLoading(false);

    if (verifyError) {
      setError("Código incorrecto. Probá de nuevo.");
      return;
    }
    goToNext();
  }

  if (awaitingMfa) {
    return (
      <form onSubmit={handleMfaSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="mfaCode">Código de verificación</Label>
          <Input
            id="mfaCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            autoFocus
            required
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Abrí tu app de autenticación (Google Authenticator, Authy, etc.) e ingresá el código de 6 dígitos.
          </p>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          Verificar
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link href="/login/olvide-password" className="text-muted-foreground hover:text-foreground text-xs">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />}
        Ingresar
      </Button>
    </form>
  );
}
