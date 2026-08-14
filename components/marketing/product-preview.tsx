import { Card } from "@/components/ui/card";
import { Carimbo } from "@/components/carimbo";
import { Money } from "@/components/money";

export function ProductPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-md bg-primary/15" />
          <div>
            <p className="font-heading text-xl font-semibold">João Pinturas</p>
            <p className="text-sm text-muted-foreground">
              Pintura residencial em São Paulo
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="font-medium">Pintura de apartamento</p>
            <p className="text-sm text-muted-foreground">
              a partir de <Money cents={120000} />
            </p>
          </div>
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="font-medium">Reparo elétrico</p>
          </div>
        </div>
        <div className="mt-6 rounded-md bg-accent px-3 py-2.5 text-center text-sm font-medium text-accent-foreground">
          Pedir orçamento
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-muted-foreground">Orçamento de João Pinturas</p>
        <p className="text-sm">Cliente: Maria</p>
        <ul className="mt-4 grid gap-2 text-sm">
          <li className="flex justify-between">
            <span>Mão de obra</span>
            <Money cents={120000} />
          </li>
          <li className="flex justify-between">
            <span>Materiais</span>
            <Money cents={45000} />
          </li>
        </ul>
        <div className="mt-3 flex justify-between border-t pt-3 font-medium">
          <span>Total</span>
          <Money cents={165000} />
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Válido até 20/08
        </p>
        <div className="mt-6 flex justify-center">
          <Carimbo label="AGENDADO — 15/08 08:00" animate size="md" />
        </div>
      </Card>
    </div>
  );
}
