import { cn } from "@/lib/utils";

export function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
    new Date(iso),
  );
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function Money({
  cents,
  className,
}: {
  cents: number;
  className?: string;
}) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {formatBRL(cents)}
    </span>
  );
}

export function Timestamp({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  return (
    <time dateTime={iso} className={cn("font-mono tabular-nums", className)}>
      {formatDateTime(iso)}
    </time>
  );
}
