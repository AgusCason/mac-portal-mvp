"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPasswordStrengthError } from "@/lib/validation";

/**
 * Paso final de "olvidé mi contraseña" — llega acá con una sesión real ya
 * establecida por /auth/callback (intercambió el código del mail por
 * cookies de sesión). Por eso `updateUser` se llama directo desde el
 * browser: necesita la sesión activa del propio cliente de Supabase, no
 * tiene sentido pasar esto por una Server Action.
 */
export function UpdatePasswordForm() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const strengthError = getPasswordStrengthError(password);
    if (strengthError) {
      setError(strengthError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("No se pudo actualizar la contraseña. Probá pedir un nuevo link.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          Este link ya no es válido o venció. Pedí uno nuevo para restablecer tu contraseña.
        </p>
        <Button asChild className="w-full">
          <a href="/login/olvide-password">Pedir un nuevo link</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña nueva</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">Al menos 8 caracteres, combinando letras y números.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Repetí la contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />}
        Guardar contraseña nueva
      </Button>
    </form>
  );
}
