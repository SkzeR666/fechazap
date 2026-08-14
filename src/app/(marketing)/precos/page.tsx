import type { Metadata } from "next";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { FaqList } from "@/components/marketing/faq-list";
import { MarketingCta } from "@/components/marketing/shell";
import { appFrame, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Preços — FechaZap",
  description:
    "Grátis, Solo R$14,90/mês e Pro R$29,90/mês. Comece com 3 fechamentos, sem cartão.",
  alternates: { canonical: "/precos" },
};

export default function PricingPage() {
  return (
    <>
      <section className={cn(appFrame, "py-16")}>
        <p className="font-mono text-sm tracking-widest text-primary uppercase">
          Preços
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Simples. Sem surpresa.</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Grátis para começar, sem cartão. Solo tira a marca e libera volume.
          Pro entra quando você quer acompanhar e automatizar o fechamento.
        </p>
        <div className="mt-10">
          <PricingGrid />
        </div>
      </section>
      <section className="border-t">
        <div className={cn(appFrame, "py-16")}>
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
