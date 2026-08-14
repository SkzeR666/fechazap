"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Timestamp } from "@/components/money";
import { one } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

type Range = "dia" | "semana" | "mes";

const SLOT_LABEL: Record<string, string> = {
  selected: "Confirmado",
  offered: "Ofertado",
};

function rangeBounds(range: Range) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  if (range === "dia") {
    end.setDate(end.getDate() + 1);
  } else if (range === "semana") {
    end.setDate(end.getDate() + 7);
  } else {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1);
    end.setDate(1);
  }
  return { start, end };
}

export default function AppAgendaPage() {
  const { token, ready } = useAccessToken();
  const queryClient = useQueryClient();
  const [range, setRange] = useState<Range>("semana");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
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
            quoteId: quote.id,
          })),
      );
    },
    enabled: ready && Boolean(token) && Boolean(quotes.data),
  });
  const exceptions = useQuery({
    queryKey: ["availability-exceptions", token],
    queryFn: () => api.provider.availabilityExceptions(token!),
    enabled: ready && Boolean(token),
  });
  const block = useMutation({
    mutationFn: () =>
      api.provider.createAvailabilityException(token!, {
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        reason: reason || undefined,
      }),
    onSuccess: () => {
      setStartsAt("");
      setEndsAt("");
      setReason("");
      toast.success("Horário bloqueado.");
      void queryClient.invalidateQueries({
        queryKey: ["availability-exceptions"],
      });
    },
    onError: () => toast.error("Não foi possível bloquear o horário."),
  });

  const { start, end } = useMemo(() => rangeBounds(range), [range]);
  const slots = [...(detailQueries.data ?? [])]
    .filter((slot) => {
      const at = new Date(slot.starts_at).getTime();
      return at >= start.getTime() && at < end.getTime();
    })
    .sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  const blocks = (exceptions.data?.data ?? []).filter((item) => {
    const at = new Date(item.starts_at).getTime();
    return at >= start.getTime() && at < end.getTime();
  });

  if (!ready || quotes.isLoading || detailQueries.isLoading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Serviços marcados e horários bloqueados.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/configuracoes/agenda">Horários da semana</Link>
        </Button>
      </div>
      <Tabs value={range} onValueChange={(value) => setRange(value as Range)}>
        <TabsList>
          <TabsTrigger value="dia">Dia</TabsTrigger>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
        </TabsList>
      </Tabs>
      {slots.length === 0 && blocks.length === 0 ? (
        <EmptyState
          title="Nenhum serviço marcado ainda."
          body="Os horários confirmados pelos seus clientes aparecem automaticamente aqui."
          cta="Criar fechamento"
          href="/app/novo"
        />
      ) : (
        <div className="grid gap-3">
          {slots.map((slot) => (
            <Card
              key={slot.id}
              className="flex-row items-center justify-between p-4"
            >
              <div>
                <p className="font-medium">{slot.customer}</p>
                <p className="text-sm text-muted-foreground">{slot.title}</p>
              </div>
              <div className="text-right">
                <Timestamp iso={slot.starts_at} />
                <p className="font-mono text-xs uppercase text-muted-foreground">
                  {SLOT_LABEL[slot.status] ?? slot.status}
                </p>
              </div>
            </Card>
          ))}
          {blocks.map((item) => (
            <Card key={item.id} className="p-4">
              <p className="font-medium">Bloqueio</p>
              <p className="text-sm text-muted-foreground">
                {item.reason ?? "Horário indisponível"}
              </p>
              <p className="mt-1 text-sm">
                <Timestamp iso={item.starts_at} /> — <Timestamp iso={item.ends_at} />
              </p>
            </Card>
          ))}
        </div>
      )}
      <Card className="max-w-xl gap-4 p-4">
        <h2 className="text-lg font-semibold">+ Bloquear horário</h2>
        <p className="text-sm text-muted-foreground">
          Bloqueios também entram na disponibilidade em{" "}
          <Link href="/app/configuracoes/agenda" className="underline">
            Configurações → Agenda
          </Link>
          .
        </p>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!startsAt || !endsAt) {
              toast.error("Informe início e fim.");
              return;
            }
            block.mutate();
          }}
        >
          <Field label="Início" htmlFor="block-start">
            <Input
              id="block-start"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </Field>
          <Field label="Fim" htmlFor="block-end">
            <Input
              id="block-end"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
            />
          </Field>
          <Field label="Motivo (opcional)" htmlFor="block-reason">
            <Input
              id="block-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Folga, deslocamento..."
            />
          </Field>
          <Button type="submit" variant="accent" disabled={block.isPending}>
            {block.isPending ? "Salvando..." : "Bloquear"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
