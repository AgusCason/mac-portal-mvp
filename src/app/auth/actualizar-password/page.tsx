import Image from "next/image";
import { KeyRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdatePasswordForm } from "./update-password-form";

export default function ActualizarPasswordPage() {
  return (
    <div className="bg-muted/40 flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image src="/logo.png" alt="MAC" width={44} height={44} className="mb-2 rounded-lg" />
          <CardTitle className="flex items-center gap-1.5 text-lg">
            <KeyRound className="text-primary size-4" /> Nueva contraseña
          </CardTitle>
          <CardDescription>Elegí una contraseña nueva para tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
