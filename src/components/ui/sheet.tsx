"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          // Antes iba pegado a un borde de la pantalla (inset-y-0 right-0),
          // sin redondeo posible en ese lado. Ahora "flota" con margen en los
          // 4 lados (inset-*-4) y esquinas redondeadas en todo el perímetro
          // — el mismo lenguaje visual que el diálogo (rounded-3xl), en vez
          // de un panel cuadrado pegado al borde.
          "bg-background/85 supports-[backdrop-filter]:bg-background/70 backdrop-blur-xl fixed z-50 flex flex-col gap-4 overflow-hidden rounded-3xl border border-border shadow-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          side === "right" &&
            "inset-y-4 right-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md",
          side === "left" &&
            "inset-y-4 left-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-md",
          side === "top" &&
            "inset-x-4 top-4 h-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          side === "bottom" &&
            "inset-x-4 bottom-4 h-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring text-muted-foreground absolute top-5 right-5 rounded-lg p-1.5 opacity-70 transition-all duration-150 hover:bg-accent hover:text-foreground hover:opacity-100 focus:ring-2 focus:outline-none">
          <XIcon className="size-4" />
          <span className="sr-only">Cerrar</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-2 p-6 pr-12", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-3 p-6", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
