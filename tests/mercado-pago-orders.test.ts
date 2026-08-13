import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPixOrder } from "../src/modules/payments/mercado-pago/orders";

describe("Mercado Pago Orders PIX", () => {
  beforeEach(() => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-test-token";
    process.env.MERCADO_PAGO_APP_ID = "6903238465916773";
  });

  afterEach(() => vi.restoreAllMocks());

  it("uses the recommended automatic Orders API payload", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "ORD01TEST",
          status: "action_required",
          status_detail: "waiting_transfer",
          transactions: {
            payments: [
              {
                payment_method: {
                  qr_code: "pix-code",
                  qr_code_base64: "base64",
                  ticket_url: "https://example.com/pix",
                },
              },
            ],
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await createPixOrder({
      quoteId: "quote-1",
      amountCents: 12345,
      email: "client@example.com",
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    const payload = JSON.parse(String(init?.body));

    expect(url).toBe("https://api.mercadopago.com/v1/orders");
    expect(init?.method).toBe("POST");
    expect(
      (init?.headers as Record<string, string>)["X-Idempotency-Key"],
    ).toBeTruthy();
    expect(payload).toMatchObject({
      type: "online",
      total_amount: "123.45",
      external_reference: "quote-1",
      processing_mode: "automatic",
      payer: { email: "client@example.com" },
      transactions: {
        payments: [
          {
            amount: "123.45",
            payment_method: { id: "pix", type: "bank_transfer" },
          },
        ],
      },
    });
    expect(result).toMatchObject({
      orderId: "ORD01TEST",
      status: "action_required",
      statusDetail: "waiting_transfer",
      pix: { qrCode: "pix-code" },
    });
  });
});
