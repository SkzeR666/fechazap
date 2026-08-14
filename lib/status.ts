import type { QuoteStatus } from "@/src/domain/quote-state";

export const STATUS_LABEL: Record<QuoteStatus, string> = {
  requested: "Solicitado",
  draft: "Rascunho",
  sent: "Enviado",
  viewed: "Visto",
  accepted: "Aceito",
  contracted: "Contrato aceito",
  awaiting_payment: "Aguardando PIX",
  paid: "Pago",
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STAMPED: QuoteStatus[] = [
  "accepted",
  "contracted",
  "paid",
  "scheduled",
  "completed",
];

export function isStamped(status: QuoteStatus) {
  return STAMPED.includes(status);
}

export function stampLabel(status: QuoteStatus, extra?: string) {
  const base = STATUS_LABEL[status].toUpperCase();
  return extra ? `${base} — ${extra}` : base;
}
