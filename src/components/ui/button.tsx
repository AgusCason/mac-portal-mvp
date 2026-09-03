import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // hover:shadow-sm + active:scale son feedback que no depende del contraste
  // de color (--accent es casi invisible sobre fondo blanco en modo claro) —
  // así se siente el hover/press incluso cuando el cambio de color es sutil.
  // transition-all (no solo -colors) para que sombra y escala animen igual.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-150 hover:shadow-sm active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
  {
    variants: {
      variant: {
        // .brand-cta (globals.css): degradé lima→info compartido con la CTA
        // de /login — el botón primario del portal entero, no solo el de
        // login, lleva ahora ese mismo tratamiento de marca. Forma píldora
        // (rounded-full, base de arriba) igual que el CTA "Abrir asistente"
        // del mockup de dashboard aprobado.
        default: "brand-cta text-primary-foreground hover:opacity-90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // ghost/link quedan sin fondo propio — la forma píldora de la base
        // igual aplica (se nota en el hover:bg-accent), pero no compiten
        // visualmente con el CTA de marca.
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "rounded-none text-primary underline-offset-4 hover:underline shadow-none hover:shadow-none active:scale-100",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        // 40px en vez de 36px — el mínimo recomendado de tap target táctil,
        // más cómodo para usuarios mayores en botones que suelen ser icon-only.
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
