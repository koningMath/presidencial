import type { Metadata } from "next";
import InvestigationCompact from "@/components/investigation-compact";
import "./compact.css";

export const metadata: Metadata = {
  title: "A conta da virada | Pulso — Eleição 2026",
  description:
    "Um panorama direto dos votos da eleição presidencial de 2026: ganhos por candidato, seções com zero voto e um cenário matemático baseado em dados oficiais do TSE.",
};

export default function InvestigationPage() {
  return <InvestigationCompact />;
}
