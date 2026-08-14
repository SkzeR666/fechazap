"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { useProfile } from "@/hooks/use-profile";
import { one, publicClosingUrl } from "@/lib/format";
import {
  STATUS_LABEL,
  needsAttention,
} from "@/lib/status";
import { EmptyState } from "@/components/empty-state";
import { Money, Timestamp, formatBRL } from "@/components/money";
import { whatsappUrl } from "@/src/lib/whatsapp";
import { interpolate, MESSAGE_TEMPLATES } from "@/lib/messages";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuoteListRow } from "@/src/lib/api/types";
import type { QuoteStatus } from "@/src/domain/quote-state";
import { upcomingSelected } from "@/lib/schedule";
import { addDays, startOfDay } from "date-fns";

const CLOSED: QuoteStatus[] = [
  "paid",
  "scheduled",
  "in_progress",
  "completed",
];
const RECEIVABLE: QuoteStatus[] = [
  "awaiting_payment",
  "partially_paid",
  "accepted",
  "contracted",
];
const SENT_PLUS: QuoteStatus[] = [
  "sent",
  "viewed",
  "accepted",
  "contracted",
  "awaiting_payment",
  "partially_paid",
  "paid",
  "scheduling_pending",
  "scheduled",
  "in_progress",
  "completed",
];
const ACCEPTED_PLUS: QuoteStatus[] = [
  "accepted",
  "contracted",
  "awaiting_payment",
  "partially_paid",
  "paid",
  "scheduling_pending",
  "scheduled",
  "in_progress",
  "completed",
];

export default function HomePage() {
  const { token, ready } = useAccessToken();
  const profile = useProfile();
  const queryClient = useQueryClient();
  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: ready && Boolean(token),
  });
  const confirmPay = useMutation({
    mutationFn: (id: string) => api.provider.confirmManualPayment(token!, id),
    onSuccess: () => {
      toast.success("Pagamento confirmado.");
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: () => toast.error("Não foi possível confirmar o pagamento."),
  });

  if (!ready || quotes.isLoading || profile.isLoading) {
    return <Skeleton className="h-64" />;
  }

  const rows = quotes.data?.data ?? [];
  const businessName = profile.data?.data?.business_name ?? "";
  const firstName = businessName.trim().split(/\s+/)[0] ?? "";
  const greeting = `${dayGreeting()}${firstName ? `, ${firstName}` : ""}.`;

  if (rows.length === 0) {
    return (
      <div className="grid gap-8">
        <div>
          <h1 className="text-2xl font-semibold">{greeting}</h1>
          <p className="mt-1 text-muted-foreground">
            Veja o que precisa da sua atenção hoje.
          </p>
        </div>
        <EmptyState
          title="Seu primeiro fechamento começa aqui."
          body="Crie a proposta, envie pelo WhatsApp e acompanhe todo o processo até o serviço concluído."
          cta="Criar fechamento"
          href="/app/novo"
        />
      </div>
    );
  }

  const metrics = computeMetrics(rows);
  const attention = rows.filter((quote) => needsAttention(quote.status));
  const from = startOfDay(new Date());
  const upcoming = upcomingSelected(rows, from, addDays(from, 7));

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{greeting}</h1>
          <p className="mt-1 text-muted-foreground">
            Veja o que precisa da sua atenção hoje.
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/app/novo">
            <Plus className="size-4" />
            Criar fechamento
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Fechado este mês"
          value={formatBRL(metrics.closedCents)}
          hint={metrics.closedHint}
        />
        <MetricCard
          label="A receber"
          value={formatBRL(metrics.receivableCents)}
          hint={
            metrics.receivableCount === 1
              ? "1 fechamento aguardando pagamento"
              : `${metrics.receivableCount} fechamentos aguardando pagamento`
          }
        />
        <MetricCard
          label="Serviços agendados"
          value={String(upcoming.length)}
          hint="Próximos 7 dias"
        />
        <MetricCard
          label="Taxa de fechamento"
          value={
            metrics.rate == null ? "—" : `${metrics.rate}%`
          }
          hint={
            metrics.sentCount === 0
              ? "Nenhuma proposta enviada ainda"
              : `${metrics.acceptedCount} de ${metrics.sentCount} propostas`
          }
        />
      </div>

      <Card className="gap-0 p-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Precisa de você</CardTitle>
        </CardHeader>
        {attention.length === 0 ? (
          <div className="px-4 py-6">
            <p className="font-medium">Tudo em dia por aqui.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nenhum fechamento precisa da sua atenção agora.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {attention.map((quote) => {
              const customer = one(quote.customers);
              const name = customer?.name ?? "Cliente";
              const href = `/app/fechamentos/${quote.id}`;
              return (
                <li
                  key={quote.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
                >
                  <Link href={href} className="min-w-0 flex-1">
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      {quote.title ?? "Serviço"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {STATUS_LABEL[quote.status]} ·{" "}
                      <Money cents={quote.total_cents} />
                    </p>
                  </Link>
                  <AttentionCta
                    quote={quote}
                    customerName={name}
                    customerPhone={customer?.phone ?? ""}
                    confirming={confirmPay.isPending}
                    onConfirm={() => confirmPay.mutate(quote.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="gap-0 p-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Próximos serviços</CardTitle>
          <CardAction>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/agenda">Ver agenda</Link>
            </Button>
          </CardAction>
        </CardHeader>
        {upcoming.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Nenhum serviço agendado no momento.
          </p>
        ) : (
          <ul className="divide-y">
            {upcoming.map((event) => (
              <li key={event.id}>
                <Link
                  href={event.href ?? `/app/fechamentos/${event.quoteId}`}
                  className="flex items-center justify-between gap-4 px-4 py-4"
                >
                  <div>
                    <p className="font-medium">{event.customer}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <Timestamp
                      iso={event.startsAt}
                      className="text-sm text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Confirmado
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AttentionCta({
  quote,
  customerName,
  customerPhone,
  confirming,
  onConfirm,
}: {
  quote: QuoteListRow;
  customerName: string;
  customerPhone: string;
  confirming: boolean;
  onConfirm: () => void;
}) {
  const href = `/app/fechamentos/${quote.id}`;
  if (quote.status === "accepted" || quote.status === "contracted") {
    return (
      <Button
        variant="accent"
        size="sm"
        disabled={confirming}
        onClick={onConfirm}
      >
        Confirmar pagamento
      </Button>
    );
  }
  if (quote.status === "sent" || quote.status === "viewed") {
    const message = interpolate(MESSAGE_TEMPLATES.novaProposta, {
      cliente: customerName,
      link: publicClosingUrl(quote.public_token),
    });
    return (
      <Button asChild variant="outline" size="sm">
        <a
          href={whatsappUrl(customerPhone, message)}
          target="_blank"
          rel="noreferrer"
        >
          Reenviar
        </a>
      </Button>
    );
  }
  if (quote.status === "requested") {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={href}>Responder</Link>
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={href}>Ver fechamento</Link>
    </Button>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-mono text-2xl tabular-nums">
          {value}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardHeader>
    </Card>
  );
}

function dayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function isSameMonth(iso: string, date: Date) {
  const value = new Date(iso);
  return (
    value.getFullYear() === date.getFullYear() &&
    value.getMonth() === date.getMonth()
  );
}

function computeMetrics(rows: QuoteListRow[]) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const closedThisMonth = rows.filter(
    (quote) => CLOSED.includes(quote.status) && isSameMonth(quote.created_at, now),
  );
  const closedLastMonth = rows.filter(
    (quote) =>
      CLOSED.includes(quote.status) && isSameMonth(quote.created_at, lastMonth),
  );
  const closedCents = closedThisMonth.reduce(
    (sum, quote) => sum + quote.total_cents,
    0,
  );
  const lastCents = closedLastMonth.reduce(
    (sum, quote) => sum + quote.total_cents,
    0,
  );
  const receivable = rows.filter((quote) => RECEIVABLE.includes(quote.status));
  const sentCount = rows.filter((quote) => SENT_PLUS.includes(quote.status)).length;
  const acceptedCount = rows.filter((quote) =>
    ACCEPTED_PLUS.includes(quote.status),
  ).length;
  let closedHint = "Neste mês";
  if (lastCents > 0) {
    const delta = Math.round(((closedCents - lastCents) / lastCents) * 100);
    const sign = delta > 0 ? "+" : "";
    closedHint = `${sign}${delta}% em relação ao mês passado`;
  }
  return {
    closedCents,
    closedHint,
    receivableCents: receivable.reduce((sum, quote) => sum + quote.total_cents, 0),
    receivableCount: receivable.length,
    scheduledCount: rows.filter((quote) => quote.status === "scheduled").length,
    sentCount,
    acceptedCount,
    rate: sentCount === 0 ? null : Math.round((acceptedCount / sentCount) * 100),
  };
}
