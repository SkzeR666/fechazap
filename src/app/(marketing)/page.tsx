import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaqList } from "@/components/marketing/faq-list";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { ProductPreview } from "@/components/marketing/product-preview";
import { MarketingCta } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "FechaZap — fecha o serviço num link só",
  description:
    "Sua página de serviços em 2 minutos. Cliente vê, pede orçamento, aceita, paga e agenda — tudo pelo seu link.",
};

const STEPS = [
  {
    n: "01",
    t: "Página",
    d: "Logo, bio e serviços no seu link. Tipo cardápio digital.",
  },
  {
    n: "02",
    t: "Orçamento",
    d: "Um formulário. Nome, WhatsApp, o quê e quanto.",
  },
  {
    n: "03",
    t: "Aceite",
    d: "Cliente confirma com nome e CPF. Fica registrado.",
  },
  { n: "04", t: "Contrato", d: "Modelo preenchido com o orçamento. Sem Word." },
  {
    n: "05",
    t: "PIX",
    d: "QR e copia-e-cola da sua chave. Você confirma o pagamento.",
  },
  { n: "06", t: "Agenda", d: "Você oferece horários. O cliente escolhe um." },
];

const NICHES = [
  {
    href: "/beleza",
    title: "Beleza",
    d: "Manicure, lash, maquiagem, cabelo — preços na bio viram página.",
  },
  {
    href: "/reforma",
    title: "Reforma",
    d: "Pintor, eletricista, encanador — orçamento que não some no WhatsApp.",
  },
  {
    href: "/autonomos",
    title: "Autônomos",
    d: "Qualquer prestador que fecha sozinho e precisa de um link profissional.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <p className="font-mono text-sm tracking-widest text-primary uppercase">
          FechaZap
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          Sua página de serviços em 2 minutos.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Cliente vê, pede orçamento, aceita, paga e agenda — tudo pelo seu
          link. Sem marketplace. Sem app.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="accent" size="lg" className="h-11">
            <Link href="/cadastro">Criar página grátis</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link href="/preview">Ver preview</Link>
          </Button>
        </div>
      </section>

      <section id="como-funciona" className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-semibold">Como funciona</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Um funil só. O status não se perde no chat.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="rounded-md border bg-card p-4">
                <p className="font-mono text-xs text-primary">{step.n}</p>
                <p className="mt-2 font-medium">{step.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">O que o cliente vê</h2>
              <p className="mt-2 text-muted-foreground">
                Vitrine + recibo. O carimbo confirma cada etapa.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/preview">Abrir preview</Link>
            </Button>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-semibold">Preços</h2>
          <p className="mt-2 mb-8 text-muted-foreground">
            Grátis pra começar. Solo pra quem vive disso. Pro existe pra medir
            interesse.
          </p>
          <PricingGrid />
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-semibold">
            Feito pra quem fecha sozinho
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {NICHES.map((niche) => (
              <Link
                key={niche.href}
                href={niche.href}
                className="rounded-md border bg-card p-5 hover:border-primary"
              >
                <p className="font-medium">{niche.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{niche.d}</p>
              </Link>
            ))}
          </div>
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

      <MarketingCta title="Monta a página. Manda o link. Fecha." />
    </>
  );
}
