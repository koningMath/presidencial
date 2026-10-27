import type { Metadata } from "next";
import Investigation from "@/components/investigation";
import "./style.css";

export const metadata: Metadata = {
  title: "A conta da virada | Pulso — Eleição 2026",
  description:
    "Uma investigação visual e interativa dos votos da eleição presidencial de 2026: primeiro e segundo turno, transferências hipotéticas, Minas Gerais, abstenção e dados oficiais do TSE.",
};

export default function InvestigationPage() {
  return <Investigation />;
}
