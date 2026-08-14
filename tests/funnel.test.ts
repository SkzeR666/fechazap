import { describe, expect, it } from "vitest";
import { computeFunnel, formatDuration, toCsv } from "../lib/funnel";
import type { QuoteListRow } from "../src/lib/api/types";

function quote(
  partial: Partial<QuoteListRow> & Pick<QuoteListRow, "id" | "status">,
): QuoteListRow {
  return {
    user_id: "u",
    customer_id: "c",
    public_token: "t",
    title: "Maquiagem",
    message: null,
    subtotal_cents: 25000,
    discount_cents: 0,
    total_cents: 25000,
    expires_at: null,
    sent_at: "2026-08-01T12:00:00.000Z",
    viewed_at: null,
    created_at: "2026-08-01T12:00:00.000Z",
    updated_at: "2026-08-02T12:00:00.000Z",
    contract_terms: null,
    contract_generated_at: null,
    customers: { id: "c", user_id: "u", name: "Mariana", phone: "11", email: null, created_at: "" },
    quote_items: [],
    appointments: [],
    quote_events: [],
    ...partial,
  };
}

describe("computeFunnel", () => {
  it("counts the closing funnel and average ticket", () => {
    const stats = computeFunnel([
      quote({ id: "1", status: "sent" }),
      quote({
        id: "2",
        status: "viewed",
        viewed_at: "2026-08-01T13:00:00.000Z",
      }),
      quote({
        id: "3",
        status: "accepted",
        quote_events: [
          {
            id: 1,
            quote_id: "3",
            actor_id: null,
            event_type: "status_changed",
            from_status: "viewed",
            to_status: "accepted",
            metadata: {},
            created_at: "2026-08-01T18:00:00.000Z",
          },
        ],
      }),
      quote({ id: "4", status: "paid", total_cents: 10000 }),
      quote({ id: "5", status: "completed", total_cents: 30000 }),
      quote({
        id: "6",
        status: "cancelled",
        quote_events: [
          {
            id: 2,
            quote_id: "6",
            actor_id: null,
            event_type: "status_changed",
            from_status: "sent",
            to_status: "cancelled",
            metadata: { reason: "Preço" },
            created_at: "2026-08-03T12:00:00.000Z",
          },
        ],
      }),
    ]);
    expect(stats.propostas).toBe(6);
    expect(stats.visualizadas).toBe(4);
    expect(stats.aceitas).toBe(3);
    expect(stats.pagas).toBe(2);
    expect(stats.concluidas).toBe(1);
    expect(stats.perdidas).toBe(1);
    expect(stats.ticketMedioCents).toBe(20000);
    expect(stats.taxaFechamento).toBe(50);
    expect(stats.losses[0]).toMatchObject({ label: "Preço", count: 1 });
  });

  it("formats duration and csv", () => {
    expect(formatDuration(3 * 60 * 60 * 1000)).toBe("3h");
    expect(toCsv([["a", 'x"y'], ["b", "c"]])).toContain('"x""y"');
    expect(toCsv([["=HYPERLINK(\"https://example.test\")"]])).toContain(
      "'=HYPERLINK",
    );
  });
});
