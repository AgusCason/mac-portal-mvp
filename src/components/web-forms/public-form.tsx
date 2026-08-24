"use client";

import * as React from "react";
import { useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { submitWebFormAction } from "@/app/actions/web-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PublicForm({ formId }: { formId: string }) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await submitWebFormAction(formId, formData);
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(res.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CheckCircle2 className="text-success size-10" />
        <p className="font-medium">¡Gracias! Recibimos tu respuesta.</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Mensaje</Label>
        <Textarea id="message" name="message" rows={4} />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="animate-spin" />}
        Enviar
      </Button>
    </form>
  );
}
