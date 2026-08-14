import type { Metadata } from "next";
import { NichePage } from "@/components/marketing/niche-page";

export const metadata: Metadata = {
  title: "FechaZap pra autônomos",
  description:
    "Página profissional e funil de fechamento pra quem trabalha sozinho.",
  alternates: { canonical: "/autonomos" },
};

export default function AutonomosPage() {
  return <NichePage slug="autonomos" />;
}
