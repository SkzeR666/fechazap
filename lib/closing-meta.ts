export type ClosingPayment = "none" | "deposit" | "full";
export type ClosingSchedule = "client_picks" | "now" | "later";

export type ClosingMeta = {
  payment: ClosingPayment;
  depositCents: number | null;
  schedule: ClosingSchedule;
  when: string | null;
};

const PREFIX = "::fz";

export function serializeClosingMeta(meta: ClosingMeta) {
  const parts = [
    `payment=${meta.payment}`,
    meta.depositCents != null ? `deposit=${meta.depositCents}` : null,
    `schedule=${meta.schedule}`,
    meta.when ? `when=${meta.when}` : null,
  ].filter(Boolean);
  return `${PREFIX} ${parts.join(";")}`;
}

export function parseClosingMeta(message: string | null | undefined): ClosingMeta {
  const fallback: ClosingMeta = {
    payment: "full",
    depositCents: null,
    schedule: "client_picks",
    when: null,
  };
  if (!message) return fallback;
  const line = message
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.startsWith(PREFIX));
  if (!line) {
    if (/nenhum antecipado/i.test(message)) fallback.payment = "none";
    if (/\bsinal\b/i.test(message)) fallback.payment = "deposit";
    if (/combinar depois/i.test(message)) fallback.schedule = "later";
    return fallback;
  }
  const body = line.slice(PREFIX.length).trim();
  const entries = Object.fromEntries(
    body.split(";").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key?.trim() ?? "", rest.join("=").trim()];
    }),
  );
  const payment =
    entries.payment === "none" ||
    entries.payment === "deposit" ||
    entries.payment === "full"
      ? entries.payment
      : fallback.payment;
  const schedule =
    entries.schedule === "client_picks" ||
    entries.schedule === "now" ||
    entries.schedule === "later"
      ? entries.schedule
      : fallback.schedule;
  const deposit = Number(entries.deposit);
  return {
    payment,
    depositCents: Number.isFinite(deposit) && deposit > 0 ? deposit : null,
    schedule,
    when: entries.when || null,
  };
}
