import { Suspense } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="bg-muted/40 flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image src="/logo.png" alt="MAC" width={44} height={44} className="mb-2 rounded-lg" />
          <CardTitle className="flex items-center gap-1.5 text-lg">
            <Sparkles className="text-primary size-4" /> MAC Portal
          </CardTitle>
          <CardDescription>Ingresá con tu cuenta de la agencia</CardDescription>
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
