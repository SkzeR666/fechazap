import { z } from "zod";
import { adminDb, userDb } from "../modules/auth/supabase";
import { MercadoPagoError } from "../modules/payments/mercado-pago/client";

export function apiError(error: unknown) {
  console.error(error);
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
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { data, error } = await adminDb().rpc("consume_rate_limit", {
    p_key: `${scope}:${ip}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}
