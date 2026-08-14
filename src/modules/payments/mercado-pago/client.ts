import { createHmac, timingSafeEqual } from "node:crypto";
import { mercadoPagoEnv, mercadoPagoWebhookEnv } from "../../platform/env";

const apiBase = "https://api.mercadopago.com";

export class MercadoPagoError extends Error {
  constructor(
    public status: number,
    public responseBody: string,
  ) {
    super(`mercado_pago_${status}`);
    this.name = "MercadoPagoError";
  }
}

async function mercadoPagoRequest(
  path: string,
  init?: RequestInit,
  accessToken = mercadoPagoEnv().MERCADO_PAGO_ACCESS_TOKEN,
) {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok)
    throw new MercadoPagoError(response.status, await response.text());
  return response.json();
}

export function mpGet(path: string) {
  return mercadoPagoRequest(path);
}

export function mpPost(path: string, body: unknown, idempotencyKey: string) {
  return mercadoPagoRequest(path, {
    method: "POST",
    headers: { "X-Idempotency-Key": idempotencyKey },
    body: JSON.stringify(body),
  });
}

export function mpPut(path: string, body: unknown) {
  return mercadoPagoRequest(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function mpGetAs(accessToken: string, path: string) {
  return mercadoPagoRequest(path, undefined, accessToken);
}

export function mpPostAs(
  accessToken: string,
  path: string,
  body: unknown,
  idempotencyKey: string,
) {
  return mercadoPagoRequest(
    path,
    {
      method: "POST",
      headers: { "X-Idempotency-Key": idempotencyKey },
      body: JSON.stringify(body),
    },
    accessToken,
  );
}

export function validateMpSignature(
  signature: string | null,
  requestId: string | null,
  dataId: string | null,
  secret: string,
) {
  if (!signature || !requestId || !dataId || !secret) return false;
  const parts = Object.fromEntries(
    signature.split(",").map((part) => part.trim().split("=")),
  );
  if (!parts.ts || !parts.v1) return false;
  const expected = createHmac("sha256", secret)
    .update(
      `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`,
    )
    .digest("hex");
  return (
    expected.length === parts.v1.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1))
  );
}

export function validMpSignature(
  signature: string | null,
  requestId: string | null,
  dataId: string | null,
) {
  return validateMpSignature(
    signature,
    requestId,
    dataId,
    mercadoPagoWebhookEnv().MERCADO_PAGO_WEBHOOK_SECRET,
  );
}
