export const quoteStatuses = [
  "requested",
  "draft",
  "sent",
  "viewed",
  "accepted",
  "contracted",
  "awaiting_payment",
  "paid",
  "scheduled",
  "completed",
  "cancelled",
] as const;
export type QuoteStatus = (typeof quoteStatuses)[number];

const transitions: Record<QuoteStatus, readonly QuoteStatus[]> = {
  requested: ["draft", "cancelled"],
  draft: ["sent", "cancelled"],
  sent: ["viewed", "accepted", "cancelled"],
  viewed: ["accepted", "cancelled"],
  accepted: ["contracted", "cancelled"],
  contracted: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["scheduled"],
  scheduled: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: QuoteStatus, to: QuoteStatus) {
  return transitions[from].includes(to);
}
