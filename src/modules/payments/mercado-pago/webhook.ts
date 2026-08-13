import { adminDb } from "../../auth/supabase";
import { mercadoPagoWebhookEnv } from "../../platform/env";
import { mpGet, validMpSignature } from "./client";

type WebhookBody = {
  id?: string | number;
  type?: string;
  action?: string;
  application_id?: string | number;
  live_mode?: boolean;
  data?: { id?: string | number };
};

const mapOrderStatus = (status: string) => {
  if (status === "processed") return "paid";
  if (["canceled", "expired", "failed", "refunded"].includes(status))
    return "cancelled";
  return "pending";
};

export async function processMercadoPagoWebhook(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json()) as WebhookBody;
  const dataId =
    url.searchParams.get("data.id") ??
    url.searchParams.get("data_id") ??
    body.data?.id?.toString() ??
    null;
  const config = mercadoPagoWebhookEnv();

  if (body.application_id?.toString() !== config.MERCADO_PAGO_APP_ID)
    return Response.json({ error: "wrong_application" }, { status: 403 });
  if (
    !validMpSignature(
      request.headers.get("x-signature"),
      request.headers.get("x-request-id"),
      dataId,
    )
  )
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  if (!dataId || !body.type)
    return Response.json({ error: "invalid_event" }, { status: 400 });

  const eventId =
    body.id?.toString() ?? `${body.type}:${body.action}:${dataId}`;
  const db = adminDb();
  const { data: claimed, error: claimError } = await db.rpc(
    "claim_webhook_event",
    {
      p_provider: "mercado_pago",
      p_event_id: eventId,
      p_event_type: body.type,
      p_payload: body,
    },
  );
  if (claimError) throw claimError;
  if (!claimed) return Response.json({ received: true, duplicate: true });

  try {
    // Mercado Pago's dashboard simulator signs a non-live event with a
    // placeholder resource ID. Validate and persist it, but never fetch or
    // mutate production resources for a simulated notification.
    if (body.live_mode === false) {
      const { error: simulatedError } = await db
        .from("webhook_events")
        .update({
          processed_at: new Date().toISOString(),
          processing_started_at: null,
          last_error: null,
        })
        .eq("provider", "mercado_pago")
        .eq("event_id", eventId);
      if (simulatedError) throw simulatedError;
      return Response.json({ received: true, simulated: true });
    }

    if (body.type === "order") {
      const order = (await mpGet(`/v1/orders/${dataId}`)) as {
        status: string;
        status_detail?: string;
        external_reference?: string;
      };
      const status = mapOrderStatus(order.status);
      const { error: paymentError } = await db
        .from("payments")
        .update({
          status,
          raw_status: `${order.status}:${order.status_detail ?? ""}`,
          paid_at: status === "paid" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("provider", "mercado_pago")
        .eq("provider_reference", dataId);
      if (paymentError) throw paymentError;
      if (status === "paid" && order.external_reference) {
        const { error: quoteError } = await db
          .from("quotes")
          .update({ status: "paid" })
          .eq("id", order.external_reference)
          .eq("status", "awaiting_payment");
        if (quoteError) throw quoteError;
      }
    }

    if (["subscription_preapproval", "preapproval"].includes(body.type)) {
      const subscription = (await mpGet(`/preapproval/${dataId}`)) as {
        status: string;
        external_reference?: string;
        next_payment_date?: string;
      };
      const status =
        subscription.status === "authorized"
          ? "active"
          : subscription.status === "cancelled"
            ? "cancelled"
            : subscription.status === "paused"
              ? "past_due"
              : "pending";
      const { error: subscriptionError } = await db
        .from("subscriptions")
        .update({
          status,
          current_period_end: subscription.next_payment_date ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("provider_reference", dataId);
      if (subscriptionError) throw subscriptionError;
      if (subscription.external_reference?.startsWith("subscription:")) {
        const [, userId, plan] = subscription.external_reference.split(":");
        const { error: profileError } = await db
          .from("profiles")
          .update({ plan: status === "active" ? plan : "free" })
          .eq("user_id", userId);
        if (profileError) throw profileError;
      }
    }

    const { error: processedError } = await db
      .from("webhook_events")
      .update({
        processed_at: new Date().toISOString(),
        processing_started_at: null,
        last_error: null,
      })
      .eq("provider", "mercado_pago")
      .eq("event_id", eventId);
    if (processedError) throw processedError;
    return Response.json({ received: true });
  } catch (error) {
    await db
      .from("webhook_events")
      .update({
        processing_started_at: null,
        last_error:
          error instanceof Error
            ? error.message.slice(0, 1000)
            : "unknown_error",
      })
      .eq("provider", "mercado_pago")
      .eq("event_id", eventId);
    throw error;
  }
}
