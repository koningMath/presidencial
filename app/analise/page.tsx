import type { Metadata } from "next";
import InvestigationCompact from "@/components/investigation-compact";
import "./compact.css";
import "./horizontal.css";

export const metadata: Metadata = {
  title: "A conta da virada | Pulso — Eleição 2026",
  description:
    "Análise horizontal dos resultados de 2026, seções zeradas, comparação de 2022 e uma hipótese fixa de transferência líquida com dados do TSE.",
};

export default function InvestigationPage() {
  return <InvestigationCompact />;
}
