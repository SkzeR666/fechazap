"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { one } from "@/lib/format";
import {
  CLOSING_FILTERS,
  statusMatchesFilter,
  type ClosingFilter,
} from "@/lib/status";
import { EmptyState } from "@/components/empty-state";
import { Money, Timestamp } from "@/components/money";
import { StatusMark } from "@/components/status-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function FechamentosPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <FechamentosList />
    </Suspense>
  );
}

function parseFilter(value: string | null): ClosingFilter {
  const match = CLOSING_FILTERS.find((filter) => filter.id === value);
  return match?.id ?? "todos";
}

function FechamentosList() {
  const { token, ready } = useAccessToken();
  const searchParams = useSearchParams();
  const etapa = parseFilter(searchParams.get("etapa"));
  const [query, setQuery] = useState("");
  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: ready && Boolean(token),
  });

  if (!ready || quotes.isLoading) {
    return <Skeleton className="h-64" />;
  }

  const rows = quotes.data?.data ?? [];
  const needle = query.trim().toLowerCase();
  const filtered = rows.filter((quote) => {
    if (!statusMatchesFilter(quote.status, etapa)) return false;
    if (!needle) return true;
    const customer = one(quote.customers);
    const haystack = `${customer?.name ?? ""} ${quote.title ?? ""}`.toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Fechamentos</h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhe cada cliente desde a proposta até a conclusão do serviço.
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/app/novo">
            <Plus className="size-4" />
            Criar fechamento
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Seu primeiro fechamento começa aqui."
          body="Crie a proposta, envie pelo WhatsApp e acompanhe todo o processo até o serviço concluído."
          cta="Criar fechamento"
          href="/app/novo"
        />
      ) : (
        <>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente ou serviço..."
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            {CLOSING_FILTERS.map((filter) => {
              const href =
                filter.id === "todos"
                  ? "/app/fechamentos"
                  : `/app/fechamentos?etapa=${filter.id}`;
              const active = etapa === filter.id;
              return (
                <Link
                  key={filter.id}
                  href={href}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
          <div className="overflow-x-auto rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Nenhum fechamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((quote) => {
                    const customer = one(quote.customers);
                    const href = `/app/fechamentos/${quote.id}`;
                    return (
                      <TableRow key={quote.id} className="cursor-pointer">
                        <TableCell>
                          <Link href={href} className="block font-medium">
                            {customer?.name ?? "—"}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={href} className="block">
                            {quote.title ?? "—"}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={href} className="block">
                            <Money cents={quote.total_cents} />
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={href} className="block">
                            <StatusMark status={quote.status} />
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={href} className="block">
                            <Timestamp
                              iso={quote.updated_at}
                              className="text-muted-foreground"
                            />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
