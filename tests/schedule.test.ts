import { describe, expect, it } from "vitest";
import { upcomingSelected } from "../lib/schedule";
import type { QuoteListRow } from "../src/lib/api/types";

const quote: QuoteListRow = {
  id: "q1",
  user_id: "u",
  customer_id: "c",
  public_token: "t",
  status: "scheduled",
  title: "Maquiagem",
  message: null,
  subtotal_cents: 25000,
  discount_cents: 0,
  total_cents: 25000,
  expires_at: null,
  sent_at: null,
  viewed_at: null,
  created_at: "2026-08-01T12:00:00.000Z",
  updated_at: "2026-08-01T12:00:00.000Z",
  contract_terms: null,
  contract_generated_at: null,
  customers: {
    id: "c",
    user_id: "u",
    name: "Mariana",
    phone: "11",
    email: null,
    created_at: "",
  },
  quote_items: [],
  appointments: [
    {
      id: "a1",
      quote_id: "q1",
      starts_at: "2026-08-14T18:00:00.000Z",
      status: "selected",
      selected_at: "2026-08-10T12:00:00.000Z",
      created_at: "2026-08-10T12:00:00.000Z",
    },
  ],
};

describe("upcomingSelected", () => {
  it("uses appointment starts_at inside the window", () => {
    const from = new Date("2026-08-14T00:00:00.000Z");
    const to = new Date("2026-08-21T00:00:00.000Z");
    const events = upcomingSelected([quote], from, to);
    expect(events).toHaveLength(1);
    expect(events[0]?.customer).toBe("Mariana");
    expect(events[0]?.startsAt).toBe("2026-08-14T18:00:00.000Z");
  });

  it("does not invent an appointment from updated_at", () => {
    const from = new Date("2026-08-01T00:00:00.000Z");
    const to = new Date("2026-08-02T00:00:00.000Z");
    expect(upcomingSelected([{ ...quote, appointments: [] }], from, to)).toEqual(
      [],
    );
  });
});
