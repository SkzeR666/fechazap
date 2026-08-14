import { adminDb } from "../../auth/supabase";
import { mercadoPagoWebhookEnv } from "../../platform/env";
import { mpGet, mpGetAs, validMpSignature } from "./client";
import { sellerAccessToken } from "./connect";

type WebhookBody = {
  id?: string | number;
  type?: string;
  action?: string;
  application_id?: string | number;
  live_mode?: boolean;
  data?: {
    id?: string | number;
    status?: string;
    status_detail?: string;
    external_reference?: string;
  };
};

type MercadoPagoOrder = {
  status: string;
  status_detail?: string;
  external_reference?: string;
};

const mapOrderStatus = (status: string) => {
  if (status === "processed") return "paid";
  if (["canceled", "expired", "failed", "refunded"].includes(status))
    return "cancelled";
  return "pending";
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

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
      const { data: paymentOwner, error: ownerError } = await db
        .from("payments")
        .select("quotes(user_id)")
        .eq("provider", "mercado_pago")
        .eq("provider_reference", dataId)
        .single();
      if (ownerError) throw ownerError;
      const ownerQuote = Array.isArray(paymentOwner.quotes)
        ? paymentOwner.quotes[0]
        : paymentOwner.quotes;
      const accessToken = ownerQuote?.user_id
        ? await sellerAccessToken(ownerQuote.user_id)
        : null;
      if (!accessToken) throw new Error("mercado_pago_connection_not_found");
      // Dashboard simulations embed the complete synthetic order. Production
      // notifications normally carry only data.id and are fetched from MP.
      const order: MercadoPagoOrder = body.data?.status
        ? {
            status: body.data.status,
            status_detail: body.data.status_detail,
            external_reference: body.data.external_reference,
          }
        : ((await mpGetAs(
            accessToken,
            `/v1/orders/${dataId}`,
          )) as MercadoPagoOrder);
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
      if (
        status === "paid" &&
        order.external_reference &&
        isUuid(order.external_reference)
      ) {
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
