import { describe, expect, it } from "vitest";
import { canTransition } from "../src/domain/quote-state.js";

describe("quote state machine", () => {
  it("allows the happy path", () => {
    expect(canTransition("requested", "draft")).toBe(true);
    expect(canTransition("viewed", "accepted")).toBe(true);
    expect(canTransition("awaiting_payment", "paid")).toBe(true);
  });
  it("blocks skipping payment and reopening terminal states", () => {
    expect(canTransition("accepted", "paid")).toBe(false);
    expect(canTransition("completed", "draft")).toBe(false);
    expect(canTransition("cancelled", "draft")).toBe(false);
  });
});
