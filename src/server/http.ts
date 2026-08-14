import { z } from "zod";
import { createHash } from "node:crypto";
import { adminDb, userDb } from "../modules/auth/supabase";
import { MercadoPagoError } from "../modules/payments/mercado-pago/client";

class RequestBodyError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

export function apiError(error: unknown) {
  console.error(
    JSON.stringify({
      level: "error",
      message: "api_request_failed",
      errorType: error instanceof Error ? error.name : "unknown",
      errorCode:
        typeof error === "object" && error && "code" in error
          ? String(error.code).slice(0, 80)
          : undefined,
    }),
  );
  if (error instanceof RequestBodyError)
    return Response.json({ error: error.code }, { status: error.status });
  if (error instanceof z.ZodError)
    return Response.json(
      { error: "invalid_request", issues: error.issues },
      { status: 400 },
    );
  if (error instanceof MercadoPagoError) {
    const sameAccount = /payer.*collector|collector.*payer/i.test(
      error.responseBody,
    );
    return Response.json(
      {
        error: "mercado_pago_error",
        detail: sameAccount
          ? "Use uma conta Mercado Pago diferente da conta vendedora."
          : "O Mercado Pago recusou a criação do checkout. Confira o e-mail do pagador e tente novamente.",
      },
      { status: 502 },
    );
  }
  return Response.json({ error: "internal_error" }, { status: 500 });
}

export async function validatedJson<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
  maxBytes = 32_768,
): Promise<z.infer<T>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json"))
    throw new RequestBodyError(415, "json_required");
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes)
    throw new RequestBodyError(413, "payload_too_large");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes)
    throw new RequestBodyError(413, "payload_too_large");
  try {
    return schema.parse(JSON.parse(text));
  } catch (error) {
    if (error instanceof z.ZodError) throw error;
    throw new RequestBodyError(400, "invalid_json");
  }
}

export async function authenticatedDb(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const db = userDb(token);
  const {
    data: { user },
    error,
  } = await db.auth.getUser(token);
  if (error || !user) return null;
  return { db, user };
}

export async function rateLimit(
  request: Request,
  scope: string,
  limit = 10,
  windowSeconds = 60,
) {
  const rawIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip")?.trim() ??
    "unknown";
  const ipHash = createHash("sha256")
    .update(rawIp.slice(0, 128))
    .digest("hex")
    .slice(0, 24);
  const { data, error } = await adminDb().rpc("consume_rate_limit", {
    p_key: `${scope}:${ipHash}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}
