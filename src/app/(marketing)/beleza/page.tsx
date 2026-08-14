import type { Metadata } from "next";
import { NichePage } from "@/components/marketing/niche-page";

export const metadata: Metadata = {
  title: "FechaZap pra beleza",
  description:
    "Página de serviços pra manicure, lash, maquiadora e cabeleireiro. Cliente vê o preço e fecha no link.",
  alternates: { canonical: "/beleza" },
};

export default function BelezaPage() {
  return <NichePage slug="beleza" />;
}
