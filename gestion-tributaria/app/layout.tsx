import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css"; // Importa tus estilos Tailwind v4 limpios

export const metadata: Metadata = {
  title: "Estudio Contable - Gestión Tributaria",
  description: "Plataforma de liquidaciones e impuestos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
      <html lang="es">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}