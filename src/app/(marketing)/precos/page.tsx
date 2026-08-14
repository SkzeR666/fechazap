import type { Metadata } from "next";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { FaqList } from "@/components/marketing/faq-list";
import { MarketingCta } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Preços — FechaZap",
  description:
    "Grátis, Solo R$39/mês e Pro R$79/mês. Comece com 3 fechamentos.",
};

export default function PricingPage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-4 py-16">
        <p className="font-mono text-sm tracking-widest text-primary uppercase">
          Preços
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Simples. Sem surpresa.</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          O grátis já fecha o ciclo. Solo tira a marca e libera volume. Pro está
          na página pra saber se equipe e relatório importam.
        </p>
        <div className="mt-10">
          <PricingGrid />
        </div>
      </section>
      <section className="border-t">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <h2 className="text-2xl font-semibold">Perguntas</h2>
          <div className="mt-6">
            <FaqList />
          </div>
        </div>
      </section>
      <MarketingCta title="Três fechamentos grátis. Sem cartão." />
    </>
  );
}
