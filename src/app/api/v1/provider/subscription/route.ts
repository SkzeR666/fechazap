import { randomUUID } from "node:crypto";
import { z } from "zod";
import { platformEnv } from "@/src/modules/platform/env";
import { mpPost, mpPut } from "@/src/modules/payments/mercado-pago/client";
import { apiError, authenticatedDb } from "@/src/server/http";
const schema = z.object({
  plan: z.enum(["solo", "pro"]),
  payerEmail: z.string().email(),
});
const prices = { solo: 39, pro: 79 };
export async function GET(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { data, error } = await auth.db
      .from("subscriptions")
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return Response.json({ data });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const body = schema.parse(await request.json());
    const result = (await mpPost(
      "/preapproval",
      {
        reason: `FechaZap ${body.plan}`,
        external_reference: `subscription:${auth.user.id}:${body.plan}`,
        payer_email: body.payerEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: prices[body.plan],
          currency_id: "BRL",
        },
        back_url: `${platformEnv().APP_URL}/dashboard/assinatura`,
        notification_url: `${platformEnv().APP_URL}/api/webhooks/mercado-pago`,
        status: "pending",
      },
      randomUUID(),
    )) as { id: string; status: string; init_point: string };
    const { error } = await auth.db.from("subscriptions").upsert(
      {
        user_id: auth.user.id,
        provider_reference: result.id,
        plan: body.plan,
        status: "pending",
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    return Response.json(
      {
        subscriptionId: result.id,
        status: result.status,
        checkoutUrl: result.init_point,
      },
      { status: 201 },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { data, error } = await auth.db
      .from("subscriptions")
      .select("provider_reference")
      .maybeSingle();
    if (error) throw error;
    if (!data?.provider_reference)
      return Response.json(
        { error: "subscription_not_found" },
        { status: 404 },
      );
    await mpPut(`/preapproval/${data.provider_reference}`, {
      status: "cancelled",
    });
    const { error: updateError } = await auth.db
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("provider_reference", data.provider_reference);
    if (updateError) throw updateError;
    await auth.db
      .from("profiles")
      .update({ plan: "free" })
      .eq("user_id", auth.user.id);
    return Response.json({ status: "cancelled" });
  } catch (e) {
    return apiError(e);
  }
}
