import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingCta } from "@/components/marketing/shell";
import { appFrame } from "@/lib/utils";

type Niche = {
  eyebrow: string;
  title: string;
  lead: string;
  points: string[];
};

const NICHES: Record<string, Niche> = {
  beleza: {
    eyebrow: "Beleza",
    title: "Manda o link. A cliente confirma e agenda.",
    lead: "Manicure, lash, maquiadora, cabeleireiro. Você envia o fechamento. Ela aceita, paga o sinal e escolhe o horário — sem ficar no vai-e-volta do WhatsApp.",
    points: [
      "Proposta com serviço, valor e validade",
      "Aceite e pagamento no mesmo link",
      "Agenda sem a cliente criar conta",
    ],
  },
  reforma: {
    eyebrow: "Reforma e manutenção",
    title: "A proposta não some no WhatsApp.",
    lead: "Pintor, eletricista, encanador. Você manda um link. O cliente aceita, paga a entrada e marca o dia.",
    points: [
      "Monte o fechamento: o quê, quanto, sinal",
      "Aceite registrado com nome e CPF",
      "PIX e horário no mesmo fluxo",
    ],
  },
  autonomos: {
    eyebrow: "Autônomos",
    title: "Feche o serviço. Sem site caro.",
    lead: "Você já tem o cliente. Falta um fluxo limpo pra aceitar, receber e agendar — sem perder o status no chat.",
    points: [
      "Um link pra mandar no WhatsApp",
      "Cliente fecha sem criar conta",
      "3 fechamentos grátis por mês",
    ],
  },
};

export function NichePage({ slug }: { slug: keyof typeof NICHES }) {
  const niche = NICHES[slug];
  if (!niche) return null;
  return (
    <>
      <section className={`${appFrame} py-16`}>
        <p className="font-mono text-sm tracking-widest text-primary uppercase">
          {niche.eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-semibold">{niche.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{niche.lead}</p>
        <ul className="mt-8 grid gap-2 text-sm">
          {niche.points.map((point) => (
            <li key={point}>— {point}</li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="accent" className="h-11">
            <Link href="/criar-conta">Começar grátis</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/preview">Ver preview</Link>
          </Button>
        </div>
      </section>
      <MarketingCta title="Menos “vou ver e te aviso”. Mais serviço fechado." />
    </>
  );
}
