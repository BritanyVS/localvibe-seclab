import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalVibe Explorer · Descubre la vibra de tu barrio",
  description:
    "Directorio inteligente de comercios locales, emprendimientos y experiencias de barrio, guiado por el Conserje Vibe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}