import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingCta } from "@/components/marketing/shell";

type Niche = {
  eyebrow: string;
  title: string;
  lead: string;
  points: string[];
};

const NICHES: Record<string, Niche> = {
  beleza: {
    eyebrow: "Beleza",
    title: "Preço na bio. Orçamento que fecha.",
    lead: "Manicure, lash, maquiadora, cabeleireiro. O cliente abre o link, vê o serviço e confirma — sem ficar perguntando valor no direct.",
    points: [
      "Página com serviços e preços opcionais",
      "Pedido de orçamento pelo próprio link",
      "PIX e horário no mesmo fluxo",
    ],
  },
  reforma: {
    eyebrow: "Reforma e manutenção",
    title: "Orçamento que não some no WhatsApp.",
    lead: "Pintor, eletricista, encanador. Você manda um link. O cliente aceita, paga a entrada e marca o dia.",
    points: [
      "Formulário único: o quê, quanto, entrada",
      "Contrato simples preenchido com o orçamento",
      "Timeline de status por cliente",
    ],
  },
  autonomos: {
    eyebrow: "Autônomos",
    title: "Presença profissional sem site caro.",
    lead: "Você já tem o cliente. Falta um lugar limpo pra mostrar o serviço e um funil que não se perde no chat.",
    points: [
      "Link único pra bio, cartão e grupo",
      "Aceite com nome e CPF registrado",
      "3 fechamentos grátis por mês",
    ],
  },
};

export function NichePage({ slug }: { slug: keyof typeof NICHES }) {
  const niche = NICHES[slug];
  if (!niche) return null;
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 py-16">
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
            <Link href="/cadastro">Criar página grátis</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/preview">Ver preview</Link>
          </Button>
        </div>
      </section>
      <MarketingCta title="Mesmo produto. Copy do seu nicho." />
    </>
  );
}
