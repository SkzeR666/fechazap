"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { one } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { Money, Timestamp } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SolicitacoesPage() {
  const { token, ready } = useAccessToken();
  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: ready && Boolean(token),
  });

  if (!ready || quotes.isLoading) return <Skeleton className="h-64" />;

  const rows = (quotes.data?.data ?? []).filter(
    (quote) => quote.status === "requested",
  );

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Solicitações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pedidos que chegaram pela sua página pública. Monte a proposta e
          envie o link.
        </p>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação no momento"
          body="Quando alguém pedir atendimento na sua página, o pedido aparece aqui."
          cta="Ver página pública"
          href="/app/links"
        />
      ) : (
        <ul className="grid gap-3">
          {rows.map((quote) => {
            const customer = one(quote.customers);
            return (
              <Card
                key={quote.id}
                className="flex-row flex-wrap items-center justify-between gap-4 p-4"
              >
                <div>
                  <p className="font-medium">{customer?.name ?? "Cliente"}</p>
                  <p className="text-sm text-muted-foreground">
                    {quote.title ??
                      quote.quote_items?.[0]?.description ??
                      "Atendimento"}
                    {quote.total_cents > 0 ? (
                      <>
                        {" "}
                        · <Money cents={quote.total_cents} />
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pedido em <Timestamp iso={quote.created_at} />
                  </p>
                </div>
                <Button asChild variant="accent">
                  <Link href={`/app/fechamentos/${quote.id}`}>Responder</Link>
                </Button>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
