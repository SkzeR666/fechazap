export const quoteStatuses = [
  "requested",
  "draft",
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
  "cancelled",
  "expired",
  "declined",
  "refunded",
] as const;
export type QuoteStatus = (typeof quoteStatuses)[number];

const transitions: Record<QuoteStatus, readonly QuoteStatus[]> = {
  requested: ["draft", "sent", "cancelled", "declined"],
  draft: ["sent", "cancelled"],
  sent: ["viewed", "accepted", "cancelled", "expired", "declined"],
  viewed: ["accepted", "cancelled", "expired", "declined"],
  accepted: [
    "contracted",
    "awaiting_payment",
    "scheduling_pending",
    "cancelled",
  ],
  contracted: ["awaiting_payment", "scheduling_pending", "cancelled"],
  awaiting_payment: ["partially_paid", "paid", "cancelled", "expired"],
  partially_paid: ["paid", "cancelled", "refunded"],
  paid: ["scheduling_pending", "scheduled", "refunded"],
  scheduling_pending: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "completed", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  expired: [],
  declined: [],
  refunded: [],
};

export function canTransition(from: QuoteStatus, to: QuoteStatus) {
  return transitions[from].includes(to);
}
