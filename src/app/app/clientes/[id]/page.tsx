"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Money, Timestamp } from "@/components/money";
import { StatusMark } from "@/components/status-mark";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import type { QuoteStatus } from "@/src/domain/quote-state";

const PAID: QuoteStatus[] = [
  "paid",
  "scheduling_pending",
  "scheduled",
  "in_progress",
  "completed",
];

export default function AppCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, ready } = useAccessToken();
  const customer = useQuery({
    queryKey: ["customer", id, token],
    queryFn: () => api.provider.customer(token!, id),
    enabled: ready && Boolean(token) && Boolean(id),
  });
  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: ready && Boolean(token),
  });

  if (!ready || customer.isLoading || quotes.isLoading) {
    return <Skeleton className="h-64" />;
  }
  if (!customer.data) {
    return <p className="text-muted-foreground">Cliente não encontrado.</p>;
  }

  const history = (quotes.data?.data ?? []).filter(
    (quote) => quote.customer_id === id,
  );
  const paidTotal = history
    .filter((quote) => PAID.includes(quote.status))
    .reduce((sum, quote) => sum + quote.total_cents, 0);
  const completedTotal = history
    .filter((quote) => quote.status === "completed")
    .reduce((sum, quote) => sum + quote.total_cents, 0);

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="-ml-2 mb-2">
            <Link href="/app/clientes">← Clientes</Link>
          </Button>
          <h1 className="text-2xl font-semibold">{customer.data.name}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {customer.data.phone}
          </p>
          <p className="text-sm text-muted-foreground">
            {customer.data.email ?? "Sem e-mail"}
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href={`/app/novo?cliente=${id}`}>+ Novo fechamento</Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Fechamentos</p>
          <p className="mt-1 font-heading text-2xl font-mono">{history.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pago</p>
          <p className="mt-1 font-heading text-2xl">
            <Money cents={paidTotal} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Concluído</p>
          <p className="mt-1 font-heading text-2xl">
            <Money cents={completedTotal} />
          </p>
        </Card>
      </div>
      <div>
        <h2 className="text-lg font-semibold">Histórico</h2>
        {history.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Nenhum fechamento ainda"
              body="Crie o primeiro fechamento para este cliente."
              cta="+ Novo fechamento"
              href={`/app/novo?cliente=${id}`}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {history.map((quote) => (
              <Card key={quote.id} className="p-4">
                <Link
                  href={`/app/fechamentos/${quote.id}`}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{quote.title ?? "Fechamento"}</p>
                    <Timestamp
                      iso={quote.created_at}
                      className="text-sm text-muted-foreground"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Money cents={quote.total_cents} />
                    <StatusMark status={quote.status} />
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
