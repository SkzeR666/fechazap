"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AgendaBoard, type AgendaRange } from "@/components/agenda-board";
import { calendarEventsFromQuotes, type CalendarEvent } from "@/lib/schedule";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import Link from "next/link";

function rangeWindow(range: AgendaRange, anchor: Date) {
  if (range === "dia") {
    const start = startOfDay(anchor);
    return { start, end: addDays(start, 1) };
  }
  if (range === "semana") {
    const start = startOfWeek(anchor, { weekStartsOn: 1 });
    return { start, end: addDays(endOfWeek(anchor, { weekStartsOn: 1 }), 1) };
  }
  const start = startOfMonth(anchor);
  return { start, end: addDays(endOfMonth(anchor), 1) };
}

export default function AppAgendaPage() {
  const { token, ready } = useAccessToken();
  const queryClient = useQueryClient();
  const [range, setRange] = useState<AgendaRange>("semana");
  const [anchor, setAnchor] = useState(() => new Date());
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: ready && Boolean(token),
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

  const { start, end } = useMemo(
    () => rangeWindow(range, anchor),
    [range, anchor],
  );
  const events = useMemo(() => {
    const appointments = calendarEventsFromQuotes(quotes.data?.data ?? []).filter(
      (event) => {
        const at = new Date(event.startsAt).getTime();
        return at >= start.getTime() && at < end.getTime();
      },
    );
    const blocks: CalendarEvent[] = (exceptions.data?.data ?? [])
      .filter((item) => {
        const at = new Date(item.starts_at).getTime();
        return at >= start.getTime() && at < end.getTime();
      })
      .map((item) => ({
        id: item.id,
        quoteId: item.id,
        title: item.reason ?? "Bloqueio",
        customer: "",
        startsAt: item.starts_at,
        endsAt: item.ends_at,
        status: "block",
        kind: "block",
      }));
    return [...appointments, ...blocks];
  }, [quotes.data, exceptions.data, start, end]);

  if (!ready || quotes.isLoading) {
    return <Skeleton className="h-64" />;
  }

  const empty = events.length === 0;

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dia, semana e mês. Clique no serviço para abrir o fechamento.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/configuracoes/agenda">Horários da semana</Link>
        </Button>
      </div>
      <Tabs
        value={range}
        onValueChange={(value) => setRange(value as AgendaRange)}
      >
        <TabsList>
          <TabsTrigger value="dia">Dia</TabsTrigger>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
        </TabsList>
      </Tabs>
      {empty ? (
        <p className="text-sm text-muted-foreground">
          Nenhum serviço neste período.{" "}
          <Link href="/app/novo" className="underline">
            Criar fechamento
          </Link>
        </p>
      ) : null}
      <AgendaBoard
        range={range}
        anchor={anchor}
        onAnchorChange={setAnchor}
        onPickDay={(date) => {
          setAnchor(date);
          setRange("dia");
        }}
        events={events}
      />
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
