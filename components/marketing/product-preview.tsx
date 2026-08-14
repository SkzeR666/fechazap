import { Card } from "@/components/ui/card";
import { Carimbo } from "@/components/carimbo";
import { Money } from "@/components/money";

const FLOW = [
  { label: "Proposta visualizada", detail: "Cliente abriu o link" },
  { label: "Aceitou", detail: "13/08 16:53" },
  { label: "Sinal pago", detail: "PIX confirmado" },
  { label: "Agendado", detail: "15/08 08:00" },
];

export function ProductPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-5">
        <p className="text-sm text-muted-foreground">
          Proposta de João Pinturas
        </p>
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
          Sinal de <Money cents={50000} /> · Válido até 20/08
        </p>
        <div className="mt-6 rounded-md bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground">
          Quero fechar
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-muted-foreground">Acompanhamento</p>
        <ol className="mt-4 grid gap-3">
          {FLOW.map((item) => (
            <li key={item.label} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {item.detail}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex justify-center">
          <Carimbo label="AGENDADO — 15/08 08:00" animate size="md" />
        </div>
      </Card>
    </div>
  );
}
