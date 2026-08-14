"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { one } from "@/lib/format";
import { formatBRL } from "@/components/money";
import { relativeTime } from "@/lib/relative-time";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { QuoteListRow } from "@/src/lib/api/types";

function notificationFor(quote: QuoteListRow) {
  const name = one(quote.customers)?.name ?? "Cliente";
  if (quote.status === "requested") {
    return {
      title: `${name} pediu atendimento na página`,
      at: quote.created_at,
    };
  }
  if (quote.status === "viewed") {
    return {
      title: `${name} visualizou sua proposta`,
      at: quote.viewed_at ?? quote.updated_at,
    };
  }
  if (quote.status === "accepted" || quote.status === "contracted") {
    return { title: `${name} aceitou sua proposta`, at: quote.updated_at };
  }
  if (quote.status === "paid" || quote.status === "partially_paid") {
    return {
      title: `Pagamento de ${formatBRL(quote.total_cents)} confirmado`,
      at: quote.updated_at,
    };
  }
  if (quote.status === "scheduled") {
    return {
      title: `${name} escolheu o horário`,
      at: quote.updated_at,
    };
  }
  return null;
}

export function NotificationsBell() {
  const { token, ready } = useAccessToken();
  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: ready && Boolean(token),
  });

  const items = useMemo(() => {
    return (quotes.data?.data ?? [])
      .map((quote) => {
        const note = notificationFor(quote);
        if (!note) return null;
        return { id: quote.id, ...note };
      })
      .filter((item): item is { id: string; title: string; at: string } =>
        Boolean(item),
      )
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 8);
  }, [quotes.data]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <PopoverHeader className="border-b px-3 py-2">
          <PopoverTitle>Atualizações</PopoverTitle>
        </PopoverHeader>
        {items.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            Quando o cliente pedir, abrir, aceitar, pagar ou agendar, aparece
            aqui.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="border-b last:border-b-0">
                <Link
                  href={`/app/fechamentos/${item.id}`}
                  className="block px-3 py-3 hover:bg-muted/50"
                >
                  <p className="text-sm">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {relativeTime(item.at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
