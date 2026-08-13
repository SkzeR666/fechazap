import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateMpSignature } from "../src/modules/payments/mercado-pago/client";

describe("Mercado Pago webhook", () => {
  it("aceita somente a assinatura HMAC correta", () => {
    const secret = "webhook-test-secret";
    const requestId = "request-123";
    const dataId = "ABC-987";
    const ts = "1786648596";
    const v1 = createHmac("sha256", secret)
      .update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`)
      .digest("hex");
    expect(
      validateMpSignature(`ts=${ts},v1=${v1}`, requestId, dataId, secret),
    ).toBe(true);
    expect(
      validateMpSignature(
        `ts=${ts},v1=${"0".repeat(64)}`,
        requestId,
        dataId,
        secret,
      ),
    ).toBe(false);
    expect(validateMpSignature(null, requestId, dataId, secret)).toBe(false);
  });
});
