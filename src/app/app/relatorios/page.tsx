"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBRL } from "@/components/money";
import {
  computeFunnel,
  downloadTextFile,
  formatDuration,
  quotesToCsv,
  type FunnelPeriod,
} from "@/lib/funnel";

const PERIODS: { id: FunnelPeriod; label: string }[] = [
  { id: "month", label: "Este mês" },
  { id: "30d", label: "30 dias" },
  { id: "all", label: "Tudo" },
];

export default function AppReportsPage() {
  const { token, ready } = useAccessToken();
  const [period, setPeriod] = useState<FunnelPeriod>("month");
  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: ready && Boolean(token),
  });

  const all = quotes.data?.data ?? [];
  const stats = useMemo(() => computeFunnel(all, period), [all, period]);
  const funnel = [
    { label: "Propostas", value: stats.propostas },
    { label: "Visualizadas", value: stats.visualizadas },
    { label: "Aceitas", value: stats.aceitas },
    { label: "Pagas", value: stats.pagas },
    { label: "Concluídas", value: stats.concluidas },
  ];
  const max = Math.max(1, stats.propostas);

  if (!ready || quotes.isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Funil de fechamento, ticket médio, tempo até o aceite e motivos de
            perda.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={all.length === 0}
          onClick={() =>
            downloadTextFile(
              "fechazap-fechamentos.csv",
              quotesToCsv(all),
              "text/csv;charset=utf-8",
            )
          }
        >
          Exportar CSV
        </Button>
      </div>
      <Tabs
        value={period}
        onValueChange={(value) => setPeriod(value as FunnelPeriod)}
      >
        <TabsList>
          {PERIODS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {all.length === 0 ? (
        <EmptyState
          title="Ainda não há o que medir"
          body="Envie o primeiro fechamento para ver propostas, visualizações e aceite."
          cta="Criar fechamento"
          href="/app/novo"
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="R$ fechado"
              value={formatBRL(stats.closedCents)}
            />
            <Metric
              label="Ticket médio"
              value={
                stats.ticketMedioCents == null
                  ? "—"
                  : formatBRL(stats.ticketMedioCents)
              }
            />
            <Metric
              label="Taxa de fechamento"
              value={
                stats.taxaFechamento == null ? "—" : `${stats.taxaFechamento}%`
              }
            />
            <Metric
              label="Tempo médio até o aceite"
              value={
                stats.tempoMedioMs == null
                  ? "—"
                  : formatDuration(stats.tempoMedioMs)
              }
            />
          </div>
          <Card className="gap-5 p-5">
            <div>
              <h2 className="text-lg font-semibold">Funil</h2>
              <p className="text-sm text-muted-foreground">
                Propostas → visualizadas → aceitas → pagas → concluídas
              </p>
            </div>
            <ul className="grid gap-4">
              {funnel.map((step) => (
                <li key={step.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{step.label}</span>
                    <span className="font-mono tabular-nums">{step.value}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((step.value / max) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="gap-4 p-5">
            <div>
              <h2 className="text-lg font-semibold">Motivos de perda</h2>
              <p className="text-sm text-muted-foreground">
                {stats.perdidas === 0
                  ? "Nenhum fechamento perdido neste período."
                  : `${stats.perdidas} fechamento${stats.perdidas === 1 ? "" : "s"} não avançou.`}
              </p>
            </div>
            {stats.losses.length > 0 ? (
              <ul className="grid gap-2">
                {stats.losses.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span>{item.label}</span>
                    <span className="font-mono tabular-nums">{item.count}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading font-mono text-2xl">{value}</p>
    </Card>
  );
}
