"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/money";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { one } from "@/lib/format";
import type { QuoteListRow } from "@/src/lib/api/types";
import type { QuoteStatus } from "@/src/domain/quote-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Situation = "pago" | "receber" | "parcial" | "atraso";
type Filter = "todos" | Situation;

const PAID: QuoteStatus[] = [
  "paid",
  "scheduling_pending",
  "scheduled",
  "in_progress",
  "completed",
];
const RECEIVABLE: QuoteStatus[] = [
  "accepted",
  "contracted",
  "awaiting_payment",
];
const IGNORED: QuoteStatus[] = [
  "requested",
  "draft",
  "cancelled",
  "declined",
  "refunded",
];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "pago", label: "Pago" },
  { id: "receber", label: "A receber" },
  { id: "parcial", label: "Parcial" },
  { id: "atraso", label: "Em atraso" },
];

function isOverdue(quote: QuoteListRow) {
  if (quote.status === "expired") return true;
  if (!quote.expires_at) return false;
  if (PAID.includes(quote.status) || IGNORED.includes(quote.status)) return false;
  return new Date(quote.expires_at).getTime() < Date.now();
}

function situationOf(quote: QuoteListRow): Situation | null {
  if (IGNORED.includes(quote.status)) return null;
  if (isOverdue(quote)) return "atraso";
  if (quote.status === "partially_paid") return "parcial";
  if (PAID.includes(quote.status)) return "pago";
  if (RECEIVABLE.includes(quote.status)) return "receber";
  return null;
}

const SITUATION_LABEL: Record<Situation, string> = {
  pago: "Pago",
  receber: "A receber",
  parcial: "Parcial",
  atraso: "Em atraso",
};

export default function AppFinancePage() {
  const { token, ready } = useAccessToken();
  const [filter, setFilter] = useState<Filter>("todos");
  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: ready && Boolean(token),
  });

  const rows = useMemo(() => {
    return (quotes.data?.data ?? [])
      .map((quote) => ({ quote, situation: situationOf(quote) }))
      .filter(
        (row): row is { quote: QuoteListRow; situation: Situation } =>
          row.situation !== null,
      );
  }, [quotes.data]);

  if (!ready || quotes.isLoading) return <Skeleton className="h-64" />;

  const received = rows
    .filter((row) => row.situation === "pago")
    .reduce((sum, row) => sum + row.quote.total_cents, 0);
  const pending = rows
    .filter((row) => row.situation === "receber" || row.situation === "parcial")
    .reduce((sum, row) => sum + row.quote.total_cents, 0);
  const overdue = rows
    .filter((row) => row.situation === "atraso")
    .reduce((sum, row) => sum + row.quote.total_cents, 0);
  const visible = rows.filter(
    (row) => filter === "todos" || row.situation === filter,
  );

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Valores dos fechamentos, pela situação de pagamento.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Recebido</p>
          <p className="mt-1 font-heading text-2xl">
            <Money cents={received} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">A receber</p>
          <p className="mt-1 font-heading text-2xl">
            <Money cents={pending} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Em atraso</p>
          <p className="mt-1 font-heading text-2xl">
            <Money cents={overdue} />
          </p>
        </Card>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            variant={filter === item.id ? "accent" : "outline"}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState
          title="Nada para acompanhar por enquanto."
          body="Quando seus clientes começarem a pagar, você verá tudo por aqui."
          cta="Criar fechamento"
          href="/app/novo"
        />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map(({ quote, situation }) => {
                const customer = one(quote.customers);
                return (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <Link href={`/app/fechamentos/${quote.id}`}>
                        {customer?.name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/app/fechamentos/${quote.id}`}>
                        {quote.title ?? "Fechamento"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Money cents={quote.total_cents} />
                    </TableCell>
                    <TableCell>{SITUATION_LABEL[situation]}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
