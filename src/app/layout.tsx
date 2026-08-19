import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
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

export const metadata: Metadata = {
  title: {
    default: "MAC Portal",
    template: "%s · MAC Portal",
  },
  description:
    "Portal centralizado de MAC para gestión de clientes, contenido, calendario editorial, contratos y redes sociales.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
