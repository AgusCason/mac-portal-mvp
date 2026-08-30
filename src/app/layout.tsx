import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getBranding } from "@/lib/queries/branding";
import "./globals.css";

// Self-hosteada (en vez de next/font/google) para que el build no dependa de
// alcanzar fonts.googleapis.com — funciona en CI/redes restringidas y evita
// una fuente externa en producción. Archivo variable (100–900) de Fontsource,
// subset latin. Ver src/fonts/inter-variable.woff2.
const inter = localFont({
  src: "../fonts/inter-variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const RADIUS_BY_SHAPE: Record<string, string> = {
  square: "0rem",
  rounded: "0.625rem",
  pill: "9999px",
};

// Sin esto, mobile renderiza el layout a un ancho de escritorio virtual
// (~980px) y lo escala hacia abajo — texto chico y sensación de scroll
// lateral aunque el CSS sea responsive. maximumScale/userScalable quedan en
// su default (permitir zoom), no los pisamos por accesibilidad.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * Metadata dinámica a partir del branding configurable (Fase 3.1 —
 * Configuración > Marca). Nunca debe romper el build/render: getBranding()
 * ya se cae a los defaults de MAC Portal ante cualquier error.
 */
export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  return {
    title: {
      default: branding.app_name,
      template: `%s · ${branding.app_name}`,
    },
    description:
      "Portal centralizado de MAC para gestión de clientes, contenido, calendario editorial, contratos y redes sociales.",
    icons: {
      icon: branding.favicon_url || "/favicon.png",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getBranding();
  const radius = RADIUS_BY_SHAPE[branding.button_shape] ?? RADIUS_BY_SHAPE.rounded;

  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        {/*
          Theme tokens de branding (Fase 3.1): solo color primario/acento y
          radio de bordes se aplican de verdad hoy — ver nota en
          Configuración > Marca sobre tipografía y estilo de botón, todavía
          no wireados. Van DESPUÉS de globals.css en el cascade, así que
          ganan sin necesitar !important.
        */}
        {/* Valores ya validados (hex/enum) en updateBrandingAction — no es HTML de usuario. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root { --primary: ${branding.primary_color}; --sidebar-primary: ${branding.primary_color}; --ring: ${branding.accent_color}; --radius: ${radius}; }`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
