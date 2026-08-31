import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function OlvidePasswordPage() {
  return (
    <div className="bg-muted/40 flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image src="/logo.png" alt="MAC" width={44} height={44} className="mb-2 rounded-lg" />
          <CardTitle className="flex items-center gap-1.5 text-lg">
            <Sparkles className="text-primary size-4" /> Recuperar contraseña
          </CardTitle>
          <CardDescription>Te mandamos un link a tu email para elegir una nueva.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ForgotPasswordForm />
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-3.5" /> Volver a ingresar
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
