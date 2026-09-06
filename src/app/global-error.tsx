"use client";

import { useEffect } from "react";

/**
 * Última red de contención: solo se activa si el ROOT layout mismo (el que
 * trae branding, fuentes, ThemeProvider) llega a tirar un error — algo que
 * hoy sería, por ejemplo, `getBranding()` fallando de una forma que ni su
 * propio try/catch interno contempla. Reemplaza TODO el árbol, así que
 * define su propio <html>/<body> a mano y evita depender de cualquier
 * componente compartido que pudo ser la causa del error — a propósito
 * minimalista, con estilos inline en vez de clases de Tailwind, para que
 * siga siendo legible incluso en el escenario más roto posible.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="es-AR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "1rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#1a1a1a",
          background: "#fafafa",
        }}
      >
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
          El portal no pudo cargar
        </h1>
        <p style={{ color: "#666", maxWidth: "24rem", fontSize: "0.875rem", margin: 0 }}>
          Hubo un error inesperado. Probá recargar la página en unos segundos.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: "0.25rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
