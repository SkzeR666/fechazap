import type { Metadata } from "next";
import { NichePage } from "@/components/marketing/niche-page";

export const metadata: Metadata = {
  title: "FechaZap pra reforma",
  description:
    "Orçamento, contrato, PIX e agenda pra pintor, eletricista e encanador.",
};

export default function ReformaPage() {
  return <NichePage slug="reforma" />;
}
