import { describe, expect, it } from "vitest";
import { fileKey } from "../src/modules/files/keys";

describe("file hierarchy", () => {
  it("organizes brand, customer images and quote documents", () => {
    expect(
      fileKey({ userId: "u1", category: "brand", extension: ".PNG" }),
    ).toMatch(/^users\/u1\/brand\/logos\/.+\.png$/);
    expect(
      fileKey({
        userId: "u1",
        customerId: "c1",
        category: "image",
        extension: "jpg",
      }),
    ).toMatch(/^users\/u1\/customers\/c1\/images\/.+\.jpg$/);
    expect(
      fileKey({
        userId: "u1",
        customerId: "c1",
        quoteId: "q1",
        category: "contract",
        extension: "pdf",
      }),
    ).toBe("users/u1/customers/c1/quotes/q1/contracts/contract.pdf");
  });

  it("requires customer and quote coordinates", () => {
    expect(() =>
      fileKey({ userId: "u1", category: "image", extension: "jpg" }),
    ).toThrow("customer_id_required");
    expect(() =>
      fileKey({
        userId: "u1",
        customerId: "c1",
        category: "contract",
        extension: "pdf",
      }),
    ).toThrow("quote_id_required");
  });
});
