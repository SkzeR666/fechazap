import { describe, expect, it } from "vitest";
import {
  parseClosingMeta,
  serializeClosingMeta,
} from "../lib/closing-meta.js";

describe("closing meta", () => {
  it("round-trips payment and schedule", () => {
    const line = serializeClosingMeta({
      payment: "deposit",
      depositCents: 5000,
      schedule: "later",
      when: null,
    });
    const parsed = parseClosingMeta(`Sinal: R$ 50,00\n${line}`);
    expect(parsed.payment).toBe("deposit");
    expect(parsed.depositCents).toBe(5000);
    expect(parsed.schedule).toBe("later");
  });

  it("treats nenhum antecipado as no payment", () => {
    const parsed = parseClosingMeta(
      "Pagamento: nenhum antecipado. Cliente aceita e agenda sem pagar agora.",
    );
    expect(parsed.payment).toBe("none");
  });
});
