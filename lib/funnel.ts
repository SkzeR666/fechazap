import { LOSS_REASONS } from "./loss-reasons";
import { STATUS_LABEL } from "./status";
import { one } from "./format";
import type { QuoteListRow, QuoteEventRow } from "../src/lib/api/types";
import type { QuoteStatus } from "../src/domain/quote-state";

export const FUNNEL_SENT: QuoteStatus[] = [
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

export const FUNNEL_VIEWED: QuoteStatus[] = FUNNEL_SENT.filter(
  (status) => status !== "sent",
);

export const FUNNEL_ACCEPTED: QuoteStatus[] = [
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

export const FUNNEL_PAID: QuoteStatus[] = [
  "paid",
  "scheduling_pending",
  "scheduled",
  "in_progress",
  "completed",
];

export type FunnelPeriod = "30d" | "month" | "all";

export type LossBucket = { id: string; label: string; count: number };

export type FunnelStats = {
  propostas: number;
  visualizadas: number;
  aceitas: number;
  pagas: number;
  concluidas: number;
  perdidas: number;
  closedCents: number;
  ticketMedioCents: number | null;
  taxaFechamento: number | null;
  tempoMedioMs: number | null;
  losses: LossBucket[];
};

function eventsOf(quote: QuoteListRow): QuoteEventRow[] {
  return quote.quote_events ?? [];
}

function inPeriod(iso: string, period: FunnelPeriod, now = new Date()) {
  if (period === "all") return true;
  const at = new Date(iso).getTime();
  if (period === "30d") {
    return at >= now.getTime() - 30 * 24 * 60 * 60 * 1000;
  }
  return (
    new Date(iso).getFullYear() === now.getFullYear() &&
    new Date(iso).getMonth() === now.getMonth()
  );
}

function firstReachedAt(quote: QuoteListRow, statuses: QuoteStatus[]) {
  const hits = eventsOf(quote)
    .filter((event) => event.to_status && statuses.includes(event.to_status))
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  return hits[0]?.created_at ?? null;
}

function cancelReason(quote: QuoteListRow) {
  const rawField = quote.loss_reason;
  const cancel = eventsOf(quote)
    .filter((event) => event.to_status === "cancelled")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  const raw =
    (typeof rawField === "string" && rawField.trim() ? rawField : null) ??
    (typeof cancel?.metadata?.reason === "string" ? cancel.metadata.reason : null);
  if (!raw?.trim()) return null;
  const known = LOSS_REASONS.find(
    (item) => item.label === raw || item.id === raw,
  );
  return known ?? { id: "outro", label: raw };
}

export function computeFunnel(
  quotes: QuoteListRow[],
  period: FunnelPeriod = "all",
  now = new Date(),
): FunnelStats {
  const rows = quotes.filter((quote) => inPeriod(quote.created_at, period, now));
  const propostas = rows.filter(
    (quote) => FUNNEL_SENT.includes(quote.status) || Boolean(quote.sent_at),
  );
  const visualizadas = rows.filter(
    (quote) => FUNNEL_VIEWED.includes(quote.status) || Boolean(quote.viewed_at),
  );
  const aceitas = rows.filter((quote) =>
    FUNNEL_ACCEPTED.includes(quote.status),
  );
  const pagas = rows.filter((quote) => FUNNEL_PAID.includes(quote.status));
  const concluidas = rows.filter((quote) => quote.status === "completed");
  const perdidas = rows.filter(
    (quote) =>
      quote.status === "cancelled" ||
      quote.status === "declined" ||
      quote.status === "expired",
  );
  const closedCents = pagas.reduce((sum, quote) => sum + quote.total_cents, 0);
  const durations = aceitas
    .map((quote) => {
      const start = quote.sent_at ?? quote.created_at;
      const end =
        firstReachedAt(quote, ["accepted", "contracted"]) ??
        (FUNNEL_ACCEPTED.includes(quote.status) ? quote.updated_at : null);
      if (!start || !end) return null;
      const ms = new Date(end).getTime() - new Date(start).getTime();
      return ms > 0 ? ms : null;
    })
    .filter((value): value is number => value != null);

  const lossCounts = new Map<string, LossBucket>();
  for (const quote of perdidas) {
    const reason =
      quote.status === "expired"
        ? { id: "expired", label: "Expirado" }
        : quote.status === "declined"
          ? { id: "declined", label: "Recusado" }
          : (cancelReason(quote) ?? { id: "sem_motivo", label: "Sem motivo" });
    const current = lossCounts.get(reason.id) ?? {
      id: reason.id,
      label: reason.label,
      count: 0,
    };
    current.count += 1;
    lossCounts.set(reason.id, current);
  }

  return {
    propostas: propostas.length,
    visualizadas: visualizadas.length,
    aceitas: aceitas.length,
    pagas: pagas.length,
    concluidas: concluidas.length,
    perdidas: perdidas.length,
    closedCents,
    ticketMedioCents:
      pagas.length === 0 ? null : Math.round(closedCents / pagas.length),
    taxaFechamento:
      propostas.length === 0
        ? null
        : Math.round((aceitas.length / propostas.length) * 100),
    tempoMedioMs:
      durations.length === 0
        ? null
        : Math.round(
            durations.reduce((sum, value) => sum + value, 0) / durations.length,
          ),
    losses: [...lossCounts.values()].sort((a, b) => b.count - a.count),
  };
}

export function formatDuration(ms: number) {
  const hours = ms / (60 * 60 * 1000);
  if (hours < 24) {
    const rounded = Math.max(1, Math.round(hours));
    return `${rounded}h`;
  }
  const days = hours / 24;
  if (days < 10) return `${days.toFixed(1).replace(".", ",")}d`;
  return `${Math.round(days)}d`;
}

export function quotesToCsv(quotes: QuoteListRow[]) {
  const header = [
    "Cliente",
    "Serviço",
    "Etapa",
    "Valor (R$)",
    "Criado em",
    "Enviado em",
    "Visualizado em",
    "Motivo de perda",
  ];
  const rows = quotes.map((quote) => {
    const customer = one(quote.customers);
    const loss =
      quote.status === "cancelled" ? (cancelReason(quote)?.label ?? "") : "";
    return [
      customer?.name ?? "",
      quote.title ?? "",
      STATUS_LABEL[quote.status] ?? quote.status,
      (quote.total_cents / 100).toFixed(2).replace(".", ","),
      quote.created_at,
      quote.sent_at ?? "",
      quote.viewed_at ?? "",
      loss,
    ];
  });
  return toCsv([header, ...rows]);
}

export function toCsv(rows: string[][]) {
  return `\uFEFF${rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell);
          const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
          return `"${safe.replaceAll('"', '""')}"`;
        })
        .join(";"),
    )
    .join("\n")}`;
}

export function downloadTextFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
