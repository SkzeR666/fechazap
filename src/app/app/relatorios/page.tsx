"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import type { QuoteStatus } from "@/src/domain/quote-state";

const SENT: QuoteStatus[] = [
  "sent",
  "viewed",
  "accepted",
  "contracted",
  "awaiting_payment",
  "partially_paid",
  "paid",
  "scheduling_pending",
  "scheduled",
  "in_progress",
  "completed",
];
const VIEWED: QuoteStatus[] = SENT.filter((status) => status !== "sent");
const ACCEPTED: QuoteStatus[] = [
  "accepted",
  "contracted",
  "awaiting_payment",
  "partially_paid",
  "paid",
  "scheduling_pending",
  "scheduled",
  "in_progress",
  "completed",
];
const PAID: QuoteStatus[] = [
  "paid",
  "scheduling_pending",
  "scheduled",
  "in_progress",
  "completed",
];

function rate(part: number, total: number) {
  if (total === 0) return "—";
  return `${Math.round((part / total) * 100)}%`;
}

export default function AppReportsPage() {
  const { token, ready } = useAccessToken();
  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: ready && Boolean(token),
  });

  if (!ready || quotes.isLoading) return <Skeleton className="h-64" />;

  const all = quotes.data?.data ?? [];
  const propostas = all.filter(
    (quote) => SENT.includes(quote.status) || quote.sent_at,
  ).length;
  const visualizadas = all.filter(
    (quote) => VIEWED.includes(quote.status) || quote.viewed_at,
  ).length;
  const aceitas = all.filter((quote) => ACCEPTED.includes(quote.status)).length;
  const pagas = all.filter((quote) => PAID.includes(quote.status)).length;
  const concluidas = all.filter((quote) => quote.status === "completed").length;

  const metrics = [
    { label: "Propostas", value: String(propostas) },
    { label: "Visualizadas", value: String(visualizadas) },
    { label: "Aceitas", value: String(aceitas) },
    { label: "Pagas", value: String(pagas) },
    { label: "Concluídas", value: String(concluidas) },
    { label: "Taxa de aceite", value: rate(aceitas, propostas) },
  ];

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contagem simples do funil, com os fechamentos que você já tem.
        </p>
      </div>
      {all.length === 0 ? (
        <EmptyState
          title="Ainda não há o que medir"
          body="Envie o primeiro fechamento para ver propostas, visualizações e aceite."
          cta="+ Novo fechamento"
          href="/app/novo"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((item) => (
            <Card key={item.label} className="p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 font-heading font-mono text-2xl">{item.value}</p>
            </Card>
          ))}
        </div>
      )}
      <Card className="max-w-lg p-4">
        <p className="font-medium">Relatórios Pro</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Gráficos por período, exportação e clientes recorrentes entram no
          plano Pro. Os números acima já são os dados reais da sua conta.
        </p>
        <Button asChild variant="outline" className="mt-4 w-fit">
          <Link href="/app/configuracoes/plano">Ver planos</Link>
        </Button>
      </Card>
    </div>
  );
}
