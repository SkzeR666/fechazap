import type { QuoteStatus } from "@/src/domain/quote-state";

export const STATUS_LABEL: Record<QuoteStatus, string> = {
  requested: "Solicitação",
  draft: "Rascunho",
  sent: "Enviado",
  viewed: "Visualizado",
  accepted: "Aceito",
  contracted: "Aceito",
  awaiting_payment: "Aguardando pagamento",
  partially_paid: "Pagamento parcial",
  paid: "Pago",
  scheduling_pending: "Aguardando agendamento",
  scheduled: "Agendado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  expired: "Expirado",
  declined: "Recusado",
  refunded: "Estornado",
};

const STAMPED: QuoteStatus[] = [
  "accepted",
  "contracted",
  "paid",
  "scheduled",
  "in_progress",
  "completed",
];

export function isStamped(status: QuoteStatus) {
  return STAMPED.includes(status);
}

export function stampLabel(status: QuoteStatus, extra?: string) {
  const base = STATUS_LABEL[status].toUpperCase();
  return extra ? `${base} — ${extra}` : base;
}

export const CLOSING_FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "rascunho", label: "Rascunho" },
  { id: "enviado", label: "Enviado" },
  { id: "aceito", label: "Aceito" },
  { id: "pagamento", label: "Pagamento" },
  { id: "agendado", label: "Agendado" },
  { id: "concluido", label: "Concluído" },
] as const;

export type ClosingFilter = (typeof CLOSING_FILTERS)[number]["id"];

const FILTER_STATUSES: Record<ClosingFilter, QuoteStatus[]> = {
  todos: [],
  rascunho: ["requested", "draft"],
  enviado: ["sent", "viewed"],
  aceito: ["accepted", "contracted"],
  pagamento: ["awaiting_payment", "partially_paid", "paid"],
  agendado: ["scheduling_pending", "scheduled", "in_progress"],
  concluido: ["completed"],
};

export function statusMatchesFilter(
  status: QuoteStatus,
  filter: ClosingFilter,
) {
  if (filter === "todos") return true;
  return FILTER_STATUSES[filter].includes(status);
}

export function needsAttention(status: QuoteStatus) {
  return (
    status === "requested" ||
    status === "sent" ||
    status === "viewed" ||
    status === "accepted" ||
    status === "contracted" ||
    status === "awaiting_payment" ||
    status === "partially_paid" ||
    status === "scheduling_pending"
  );
}

export function nextActionCopy(status: QuoteStatus, depositLabel?: string) {
  switch (status) {
    case "requested":
      return {
        title: "Pedido na vitrine",
        body: "Monte a proposta e envie o link para o cliente.",
        cta: "Responder",
      };
    case "draft":
      return {
        title: "Rascunho",
        body: "Revise e envie a proposta pelo WhatsApp.",
        cta: "Enviar proposta pelo WhatsApp",
      };
    case "sent":
      return {
        title: "Aguardando visualização",
        body: "O cliente ainda não abriu o link.",
        cta: "Reenviar",
      };
    case "viewed":
      return {
        title: "Proposta visualizada",
        body: "O cliente abriu o link e ainda não confirmou.",
        cta: "Enviar lembrete",
      };
    case "accepted":
    case "contracted":
    case "awaiting_payment":
      return {
        title: "Aguardando pagamento",
        body: depositLabel
          ? `Aguardando o pagamento do sinal de ${depositLabel}.`
          : "Aguardando o cliente confirmar o pagamento.",
        cta: "Enviar lembrete",
      };
    case "partially_paid":
      return {
        title: "Pagamento parcial",
        body: "Registre o restante ou aguarde o próximo Pix.",
        cta: "Registrar pagamento",
      };
    case "paid":
    case "scheduling_pending":
      return {
        title: "Pagamento confirmado",
        body: "Agora falta definir o horário do serviço.",
        cta: "Agendar",
      };
    case "scheduled":
      return {
        title: "Serviço agendado",
        body: "Quando terminar, marque como concluído.",
        cta: "Concluir",
      };
    case "in_progress":
      return {
        title: "Em andamento",
        body: "Marque como concluído ao finalizar o atendimento.",
        cta: "Concluir",
      };
    default:
      return null;
  }
}

export const EVENT_LABEL: Record<string, string> = {
  status_changed: "Etapa atualizada",
  quote_accepted: "Proposta aceita",
  quote_updated: "Proposta atualizada",
  quote_created: "Fechamento criado",
  quote_sent: "Link enviado",
  quote_viewed: "Proposta visualizada",
};
