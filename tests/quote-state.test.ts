import { describe, expect, it } from "vitest";
import { canTransition } from "../src/domain/quote-state.js";

describe("quote state machine", () => {
  it("allows the happy path", () => {
    expect(canTransition("requested", "draft")).toBe(true);
    expect(canTransition("viewed", "accepted")).toBe(true);
    expect(canTransition("accepted", "awaiting_payment")).toBe(true);
    expect(canTransition("awaiting_payment", "paid")).toBe(true);
    expect(canTransition("paid", "scheduling_pending")).toBe(true);
    expect(canTransition("scheduled", "in_progress")).toBe(true);
  });
  it("blocks skipping payment and reopening terminal states", () => {
    expect(canTransition("accepted", "paid")).toBe(false);
    expect(canTransition("completed", "draft")).toBe(false);
    expect(canTransition("cancelled", "draft")).toBe(false);
    expect(canTransition("expired", "sent")).toBe(false);
  });
});
