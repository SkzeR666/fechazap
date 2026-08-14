"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaqList } from "@/components/marketing/faq-list";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { MarketingCta } from "@/components/marketing/shell";
import { GradientText } from "@/components/react-bits/gradient-text";
import { SpotlightCard } from "@/components/react-bits/spotlight-card";
import { GoldGrid } from "@/components/react-bits/gold-grid";
import { appFrame, cn } from "@/lib/utils";

const Aurora = dynamic(
  () => import("@/components/react-bits/aurora").then((mod) => mod.Aurora),
  { ssr: false },
);

const FLOW = [
  { t: "Proposta visualizada", d: "Mariana abriu o link" },
  { t: "Aceitou", d: "Confirmar serviço" },
  { t: "Sinal pago", d: "Pix R$ 50" },
  { t: "Agendado", d: "20 ago · 15:30" },
];

const STEPS = [
  {
    n: "01",
    t: "Monte",
    d: "Escolha o cliente, serviço, valor e condições.",
  },
  {
    n: "02",
    t: "Envie",
    d: "O cliente recebe um link pelo WhatsApp.",
  },
  {
    n: "03",
    t: "Feche",
    d: "Ele aceita, paga e escolhe o horário.",
  },
  {
    n: "04",
    t: "Trabalhe",
    d: "Você acompanha tudo sem caçar informação na conversa.",
  },
];

const GRID = [
  {
    t: "Proposta",
    d: "Envie valores e detalhes de forma profissional.",
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
    d: "Tenha histórico de todos os atendimentos.",
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
    d: "Maquiagem, penteado, sobrancelha — manda o link e fecha o horário.",
  },
  {
    href: "/reforma",
    title: "Reforma",
    d: "Pintor, eletricista, encanador — a proposta não some no WhatsApp.",
  },
  {
    href: "/autonomos",
    title: "Autônomos",
    d: "Fotografia, aulas, manutenção, consultoria. Qualquer serviço fechado sozinho.",
  },
];

export function LandingHome() {
  return (
    <>
      <section className="relative isolate min-h-[88vh] overflow-hidden bg-black">
        <div className="pointer-events-none absolute inset-0">
          <Aurora className="h-full w-full opacity-80" />
          <GoldGrid />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black" />
        </div>
        <div className={cn(appFrame, "relative py-20 md:py-28")}>
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="font-mono text-sm tracking-[0.2em] text-primary uppercase">
                FechaZap
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                Do orçamento ao serviço fechado.{" "}
                <GradientText>Em um link.</GradientText>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-white/70">
                Mandou o orçamento. O cliente aceitou. Pagou. Agendou. Tudo pelo
                mesmo link.
              </p>
              <p className="mt-3 max-w-xl text-white/55">
                Envie sua proposta, receba o aceite, confirme o pagamento e
                organize o agendamento sem depender de dezenas de mensagens no
                WhatsApp.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="accent" size="lg" className="h-12">
                  <Link href="/criar-conta">Criar meu primeiro fechamento</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href="/preview">Ver o link do cliente</Link>
                </Button>
              </div>
              <p className="mt-4 font-mono text-sm text-white/45">
                Grátis para começar · Sem cartão
              </p>
            </div>
            <FlowMock />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className={cn(appFrame, "py-20")}>
          <h2 className="max-w-2xl text-3xl font-semibold text-white md:text-4xl">
            Fechar um serviço não deveria dar tanto trabalho.
          </h2>
          <p className="mt-5 max-w-2xl text-white/60">
            Você manda preço. Confirma detalhes. Cobra sinal. Procura
            comprovante. Volta para marcar horário. Depois procura a conversa de
            novo.
          </p>
          <p className="mt-5 max-w-2xl text-xl text-white">
            O FechaZap transforma tudo isso em um único fluxo.
          </p>
        </div>
      </section>

      <section id="como-funciona" className="border-t border-white/10 bg-black">
        <div className={cn(appFrame, "py-20")}>
          <h2 className="text-3xl font-semibold text-white">Como funciona</h2>
          <p className="mt-2 max-w-xl text-white/55">
            Quatro passos. O status não se perde no chat.
          </p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <SpotlightCard key={step.n}>
                <p className="font-mono text-xs text-primary">{step.n}</p>
                <p className="mt-3 text-lg font-medium text-white">{step.t}</p>
                <p className="mt-2 text-sm text-white/55">{step.d}</p>
              </SpotlightCard>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className={cn(appFrame, "py-20")}>
          <h2 className="text-3xl font-semibold text-white">
            Um link. Todo o fechamento.
          </h2>
          <p className="mt-2 max-w-xl text-white/55">
            Sem planilha, sem PDF solto, sem “me manda o PIX de novo”.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GRID.map((item) => (
              <SpotlightCard key={item.t}>
                <p className="font-medium text-white">{item.t}</p>
                <p className="mt-2 text-sm text-white/55">{item.d}</p>
              </SpotlightCard>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className={cn(appFrame, "py-20")}>
          <h2 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">
            WhatsApp é ótimo para conversar.
            <br />
            <span className="text-white/45">Não para organizar seu negócio.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-white/55">
            Continue falando com seus clientes onde eles já estão. O FechaZap
            cuida do que vem depois.
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className={cn(appFrame, "py-20")}>
          <h2 className="text-3xl font-semibold text-white">Preços</h2>
          <p className="mt-2 mb-10 text-white/55">
            Grátis para começar. Solo pra quem vive disso. Pro pra acompanhar e
            automatizar.
          </p>
          <PricingGrid />
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className={cn(appFrame, "py-20")}>
          <h2 className="text-3xl font-semibold text-white">
            Feito pra quem fecha sozinho
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {NICHES.map((niche) => (
              <Link key={niche.href} href={niche.href}>
                <SpotlightCard className="h-full hover:border-primary/50">
                  <p className="font-medium text-white">{niche.title}</p>
                  <p className="mt-2 text-sm text-white/55">{niche.d}</p>
                </SpotlightCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className={cn(appFrame, "py-20")}>
          <h2 className="text-3xl font-semibold text-white">Perguntas</h2>
          <div className="mt-8">
            <FaqList />
          </div>
        </div>
      </section>

      <MarketingCta title='Menos “vou ver e te aviso”. Mais serviço fechado.' />
    </>
  );
}

function FlowMock() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-5 shadow-[0_0_80px_rgba(234,179,8,0.12)] backdrop-blur-sm">
      <p className="font-mono text-xs tracking-widest text-primary uppercase">
        fechazap.com/f/a8hd92
      </p>
      <p className="mt-4 text-lg font-medium text-white">Mariana Costa</p>
      <p className="text-sm text-white/50">Maquiagem social · R$ 250</p>
      <ol className="mt-6 grid gap-3">
        {FLOW.map((item, index) => (
          <li key={item.t} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-primary/20 font-mono text-[10px] text-primary">
              {index + 1}
            </span>
            <span>
              <span className="block text-sm text-white">{item.t}</span>
              <span className="block text-xs text-white/45">{item.d}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground">
        Quero fechar
      </div>
    </div>
  );
}
