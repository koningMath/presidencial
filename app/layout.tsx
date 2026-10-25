import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/dm-sans";
import "@fontsource/instrument-serif/latin-400.css";
import "./globals.css";
import "./light-theme.css";
export const metadata: Metadata = {
  title: "Pulso • Apuração presidencial 2026",
  description:
    "Acompanhe o segundo turno para presidente. Dados do TSE, resultados por estado e transparência em cada atualização.",
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
