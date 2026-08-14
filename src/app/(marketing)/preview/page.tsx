import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "@/components/marketing/product-preview";
import { Card } from "@/components/ui/card";
import { Carimbo } from "@/components/carimbo";
import { Money } from "@/components/money";

export const metadata: Metadata = {
  title: "Preview — FechaZap",
  description:
    "Veja a vitrine do prestador e o recibo que o cliente aceita, paga e agenda.",
};

const TIMELINE = [
  { stamp: false, label: "ENVIADO", detail: "Link no WhatsApp" },
  { stamp: true, label: "ACEITO", detail: "13/08 16:53" },
  { stamp: true, label: "PAGO", detail: "PIX confirmado" },
  { stamp: true, label: "AGENDADO", detail: "15/08 08:00" },
];

export default function PreviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <p className="font-mono text-sm tracking-widest text-primary uppercase">
        Preview
      </p>
      <h1 className="mt-3 text-4xl font-semibold">O cliente não baixa nada.</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Abre o seu link, vê o serviço, aceita o valor, paga no PIX e marca o
        horário. Você acompanha no dashboard com o mesmo carimbo.
      </p>

      <div className="mt-10">
        <ProductPreview />
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Linha do tempo</h2>
        <p className="mt-2 text-muted-foreground">
          Cada etapa confirmada ganha o carimbo. O resto da UI fica quieto.
        </p>
        <ol className="mt-8 grid gap-6 border-l pl-6">
          {TIMELINE.map((item) => (
            <li key={item.label} className="flex items-center gap-4">
              {item.stamp ? (
                <Carimbo label={item.label} size="sm" />
              ) : (
                <span className="font-mono text-xs uppercase text-muted-foreground">
                  {item.label}
                </span>
              )}
              <span className="font-mono text-sm text-muted-foreground">
                {item.detail}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Card className="mt-12 p-5">
        <p className="text-sm text-muted-foreground">Novo fechamento</p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <p>
            Cliente <span className="block font-medium">Maria</span>
          </p>
          <p>
            WhatsApp <span className="block font-mono">11999999999</span>
          </p>
          <p>
            Serviço{" "}
            <span className="block font-medium">Pintura de apartamento</span>
          </p>
          <p>
            Valor{" "}
            <span className="block">
              <Money cents={165000} />
            </span>
          </p>
        </div>
        <div className="mt-6 rounded-md bg-accent px-3 py-2.5 text-center text-sm font-medium text-accent-foreground">
          Gerar link
        </div>
      </Card>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="accent" className="h-11">
          <Link href="/cadastro">Criar minha página</Link>
        </Button>
        <Button asChild variant="outline" className="h-11">
          <Link href="/precos">Ver preços</Link>
        </Button>
      </div>
    </div>
  );
}
