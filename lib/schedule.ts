import { one } from "./format";
import type { AppointmentRow, QuoteListRow } from "../src/lib/api/types";

export type CalendarEvent = {
  id: string;
  quoteId: string;
  title: string;
  customer: string;
  startsAt: string;
  endsAt: string;
  status: string;
  kind: "appointment" | "block";
  href?: string;
};

const DEFAULT_MINUTES = 60;

export function appointmentEndIso(
  startsAt: string,
  minutes = DEFAULT_MINUTES,
) {
  return new Date(new Date(startsAt).getTime() + minutes * 60 * 1000).toISOString();
}

export function calendarEventsFromQuotes(
  quotes: QuoteListRow[],
): CalendarEvent[] {
  return quotes.flatMap((quote) =>
    (quote.appointments ?? [])
      .filter((item) => item.status === "selected" || item.status === "offered")
      .map((item) => toCalendarEvent(quote, item)),
  );
}

export function toCalendarEvent(
  quote: QuoteListRow,
  appointment: AppointmentRow,
): CalendarEvent {
  return {
    id: appointment.id,
    quoteId: quote.id,
    title: quote.title ?? "Serviço",
    customer: one(quote.customers)?.name ?? "Cliente",
    startsAt: appointment.starts_at,
    endsAt: appointmentEndIso(appointment.starts_at),
    status: appointment.status,
    kind: "appointment",
    href: `/app/fechamentos/${quote.id}`,
  };
}

export function upcomingSelected(
  quotes: QuoteListRow[],
  from: Date,
  to: Date,
): CalendarEvent[] {
  const events = calendarEventsFromQuotes(quotes).filter(
    (event) => event.status === "selected",
  );
  return events
    .filter((event) => {
      const at = new Date(event.startsAt).getTime();
      return at >= from.getTime() && at < to.getTime();
    })
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
}
