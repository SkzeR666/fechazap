import { describe, expect, it } from "vitest";
import { publicQuoteUrl, publicStorefrontUrl } from "../lib/format";

describe("public URLs", () => {
  it("uses path-based slugs, not wildcard hosts", () => {
    expect(publicStorefrontUrl("joao", "https://fechazap.com")).toBe(
      "https://fechazap.com/joao",
    );
    expect(publicQuoteUrl("joao", "abc", "https://fechazap.com")).toBe(
      "https://fechazap.com/joao/o/abc",
    );
  });
});
