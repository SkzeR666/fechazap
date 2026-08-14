import type { QuoteStatus } from "@/src/domain/quote-state";
import { Badge } from "@/components/ui/badge";
import { Carimbo } from "@/components/carimbo";
import { STATUS_LABEL, isStamped, stampLabel } from "@/lib/status";

export function StatusMark({
  status,
  extra,
  animate = false,
  size = "sm",
}: {
  status: QuoteStatus;
  extra?: string;
  animate?: boolean;
  size?: "sm" | "md";
}) {
  if (isStamped(status)) {
    return (
      <Carimbo label={stampLabel(status, extra)} animate={animate} size={size} />
    );
  }
  const variant = status === "cancelled" ? "destructive" : ("secondary" as const);
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>;
}
