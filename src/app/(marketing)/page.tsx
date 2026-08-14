import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { LandingHome } from "@/components/marketing/landing-home";

export const metadata: Metadata = {
  title: "FechaZap — do orçamento ao serviço fechado. Em um link.",
  description:
    "Mandou o orçamento. O cliente aceitou. Pagou. Agendou. Tudo pelo mesmo link. Cliente não cria conta.",
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://fechazap.vercel.app/#organization",
      name: "FechaZap",
      url: "https://fechazap.vercel.app",
      logo: "https://fechazap.vercel.app/icon",
    },
    {
      "@type": "WebApplication",
      name: "FechaZap",
      url: "https://fechazap.vercel.app",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Fluxo de fechamento: proposta, aceite, pagamento e agendamento em um único link. O cliente não cria conta.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
      },
      publisher: { "@id": "https://fechazap.vercel.app/#organization" },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={structuredData} />
      <LandingHome />
    </>
  );
}
