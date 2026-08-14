import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaqList } from "@/components/marketing/faq-list";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { ProductPreview } from "@/components/marketing/product-preview";
import { MarketingCta } from "@/components/marketing/shell";
import { appFrame, cn } from "@/lib/utils";
import { JsonLd } from "@/components/json-ld";

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

const STEPS = [
  {
    n: "01",
    t: "Monte",
    d: "Serviço, valor, sinal e condições. Vira uma proposta pronta pra enviar.",
  },
  {
    n: "02",
    t: "Envie",
    d: "Um link no WhatsApp. O cliente abre no celular, sem app e sem conta.",
  },
  {
    n: "03",
    t: "Feche",
    d: "Aceite, pagamento e agendamento no mesmo lugar. Você acompanha cada etapa.",
  },
  {
    n: "04",
    t: "Trabalhe",
    d: "O serviço está fechado. Você executa. O status não se perde no chat.",
  },
];

const GRID = [
  {
    t: "Proposta",
    d: "O cliente vê o serviço, o valor e a validade num link limpo.",
  },
  {
    t: "Aceite",
    d: "Seu cliente confirma sem criar conta.",
  },
  {
    t: "Pagamento",
    d: "Receba sinal ou valor integral.",
  },
  {
    t: "Agenda",
    d: "Deixe o cliente escolher entre seus horários disponíveis.",
  },
  {
    t: "Clientes",
    d: "Quem fechou, o que pediu e onde parou — sem planilha paralela.",
  },
  {
    t: "Acompanhamento",
    d: "Saiba quem abriu, aceitou, pagou ou ainda precisa responder.",
  },
];

const NICHES = [
  {
    href: "/beleza",
    title: "Beleza",
    d: "Manicure, lash, maquiagem, cabelo — manda o link e fecha o horário.",
  },
  {
    href: "/reforma",
    title: "Reforma",
    d: "Pintor, eletricista, encanador — a proposta não some no WhatsApp.",
  },
  {
    href: "/autonomos",
    title: "Autônomos",
    d: "Qualquer prestador que fecha sozinho e precisa de um fluxo profissional.",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={structuredData} />
      <section className={cn(appFrame, "py-16 md:py-24")}>
        <p className="font-mono text-sm tracking-widest text-primary uppercase">
          FechaZap
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          Do orçamento ao serviço fechado. Em um link.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Mandou o orçamento. O cliente aceitou. Pagou. Agendou. Tudo pelo mesmo
          link.
        </p>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Envie sua proposta, receba o aceite, confirme o pagamento e organize o
          agendamento sem depender de dezenas de mensagens no WhatsApp.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="accent" size="lg" className="h-11">
            <Link href="/criar-conta">Criar meu primeiro fechamento</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11">
            <Link href="/preview">Ver preview</Link>
          </Button>
        </div>
        <p className="mt-4 font-mono text-sm text-muted-foreground">
          Grátis para começar · Sem cartão
        </p>
        <ol className="mt-12 grid max-w-xl gap-2 text-sm">
          {[
            "Mariana Costa",
            "Proposta visualizada",
            "Aceitou",
            "Sinal pago",
            "Agendado",
          ].map((step, index) => (
            <li key={step} className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t">
        <div className={cn(appFrame, "py-16")}>
          <h2 className="max-w-2xl text-2xl font-semibold">
            Fechar um serviço não deveria dar tanto trabalho.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Você manda preço. Confirma detalhes. Cobra sinal. Procura
            comprovante. Volta para marcar horário. Depois procura a conversa de
            novo.
          </p>
          <p className="mt-4 max-w-2xl text-lg font-medium">
            O FechaZap transforma tudo isso em um único fluxo.
          </p>
        </div>
      </section>

      <section id="como-funciona" className="border-t">
        <div className={cn(appFrame, "py-16")}>
          <h2 className="text-2xl font-semibold">Como funciona</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Quatro passos. O status não se perde no chat.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className={cn(appFrame, "py-16")}>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">O que o cliente vê</h2>
              <p className="mt-2 text-muted-foreground">
                A proposta no link. O carimbo confirma cada etapa.
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
        <div className={cn(appFrame, "py-16")}>
          <h2 className="text-2xl font-semibold">Um link. Todo o fechamento.</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Sem planilha, sem PDF solto, sem “me manda o PIX de novo”.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GRID.map((item) => (
              <li key={item.t} className="rounded-md border bg-card p-4">
                <p className="font-medium">{item.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t">
        <div className={cn(appFrame, "py-16")}>
          <h2 className="text-2xl font-semibold">Preços</h2>
          <p className="mt-2 mb-8 text-muted-foreground">
            Grátis para começar. Solo pra quem vive disso. Pro pra acompanhar e
            automatizar.
          </p>
          <PricingGrid />
        </div>
      </section>

      <section className="border-t">
        <div className={cn(appFrame, "py-16")}>
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

      <section className="border-t bg-muted/30">
        <div className={cn(appFrame, "py-16")}>
          <h2 className="max-w-2xl text-3xl font-semibold">
            WhatsApp é ótimo para conversar.
            <br />
            Não para organizar seu negócio.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Continue falando com seus clientes onde eles já estão. O FechaZap
            cuida do que vem depois.
          </p>
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

      <MarketingCta title='Menos “vou ver e te aviso”. Mais serviço fechado.' />
    </>
  );
}
