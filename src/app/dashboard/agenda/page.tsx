"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Timestamp } from "@/components/money";
import { one } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgendaPage() {
  const { token, ready } = useAccessToken();
  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: ready && Boolean(token),
  });
  const detailQueries = useQuery({
    queryKey: ["agenda", token, quotes.data?.data.map((q) => q.id)],
    queryFn: async () => {
      const ids = quotes.data?.data.map((q) => q.id) ?? [];
      const details = await Promise.all(
        ids.map((id) => api.provider.quote(token!, id)),
      );
      return details.flatMap((quote) =>
        (quote.appointments ?? [])
          .filter(
            (item) => item.status === "selected" || item.status === "offered",
          )
          .map((item) => ({
            ...item,
            title: quote.title,
            customer: one(quote.customers)?.name,
          })),
      );
    },
    enabled: ready && Boolean(token) && Boolean(quotes.data),
  });

  if (!ready || quotes.isLoading || detailQueries.isLoading) {
    return <Skeleton className="h-64" />;
  }

  const slots = [...(detailQueries.data ?? [])].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Agenda</h1>
      <div className="mt-6 grid gap-3">
        {slots.length === 0 ? (
          <p className="text-muted-foreground">Nenhum horário ainda.</p>
        ) : (
          slots.map((slot) => (
            <Card
              key={slot.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p className="font-medium">{slot.customer}</p>
                <p className="text-sm text-muted-foreground">{slot.title}</p>
              </div>
              <div className="text-right">
                <Timestamp iso={slot.starts_at} />
                <p className="font-mono text-xs uppercase text-muted-foreground">
                  {slot.status}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
