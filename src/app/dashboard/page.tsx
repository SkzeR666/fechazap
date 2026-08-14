"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Money } from "@/components/money";
import { StatusMark } from "@/components/status-mark";
import { one } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { token, ready } = useAccessToken();
  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: ready && Boolean(token),
  });

  if (!ready || quotes.isLoading) {
    return <Skeleton className="h-64" />;
  }

  const rows = quotes.data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Orçamentos</h1>
        <Button asChild variant="accent">
          <Link href="/dashboard/orcamentos/novo">+ Novo fechamento</Link>
        </Button>
      </div>
      <div className="mt-6 overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Nenhum orçamento ainda.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((quote) => {
                const customer = one(quote.customers);
                return (
                  <TableRow key={quote.id} className="cursor-pointer">
                    <TableCell>
                      <Link
                        href={`/dashboard/orcamentos/${quote.id}`}
                        className="block"
                      >
                        {customer?.name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/orcamentos/${quote.id}`}
                        className="block"
                      >
                        {quote.title ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/orcamentos/${quote.id}`}
                        className="block"
                      >
                        <Money cents={quote.total_cents} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusMark status={quote.status} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
