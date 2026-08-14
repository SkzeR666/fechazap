import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarketingCta } from "@/components/marketing/shell";
import { appFrame, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ajuda — FechaZap",
  description:
    "Como o FechaZap fecha o serviço num link só. Cliente não cria conta.",
  alternates: { canonical: "/ajuda" },
};

const ITEMS = [
  {
    q: "O que é o FechaZap?",
    a: "Um fluxo de fechamento. Você monta a proposta, envia um link, e o cliente aceita, paga e agenda — sem criar conta.",
  },
  {
    q: "O cliente precisa criar conta?",
    a: "Não. Ele recebe o link, confirma, paga e escolhe o horário no celular. Sem app, sem senha.",
  },
  {
    q: "Quanto custa?",
    a: (
      <>
        Grátis para começar, sem cartão. Três fechamentos no mês. Solo e Pro
        estão em{" "}
        <Link href="/precos" className="text-foreground underline">
          preços
        </Link>
        .
      </>
    ),
  },
  {
    q: "Como eu começo?",
    a: (
      <>
        <Link href="/criar-conta" className="text-foreground underline">
          Crie sua conta
        </Link>
        , monte o primeiro fechamento e mande o link no WhatsApp.
      </>
    ),
  },
];

export default function HelpPage() {
  return (
    <>
      <section className={cn(appFrame, "py-16")}>
        <p className="font-mono text-sm tracking-widest text-primary uppercase">
          Ajuda
        </p>
        <h1 className="mt-3 text-4xl font-semibold">
          Do orçamento ao serviço fechado.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Orçamento, aceite, pagamento e agendamento em um único link. O cliente
          nunca cria conta.
        </p>
        <Accordion type="single" collapsible className="mt-10 w-full">
          {ITEMS.map((item, index) => (
            <AccordionItem key={item.q} value={`ajuda-${index}`}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="accent" className="h-11">
            <Link href="/criar-conta">Começar grátis</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/precos">Ver preços</Link>
          </Button>
        </div>
      </section>
      <MarketingCta title="Criar meu primeiro fechamento. Sem cartão." />
    </>
  );
}
