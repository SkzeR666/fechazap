import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { contractPdf } from "../src/lib/pdf";

describe("contract PDF", () => {
  it("gera um PDF válido de uma página", async () => {
    const bytes = await contractPdf({
      business: "FechaZap",
      customer: "Cliente Teste",
      title: "Serviço",
      totalCents: 12500,
      terms: "Execução conforme orçamento aceito.",
      acceptedAt: "2026-08-13T12:00:00.000Z",
    });
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBe(1);
    expect(bytes.length).toBeGreaterThan(500);
  });
});
