import { createPixOrder } from "@/src/modules/payments/mercado-pago/orders";
import { sellerAccessToken } from "@/src/modules/payments/mercado-pago/connect";
import { adminDb } from "@/src/modules/auth/supabase";
import { apiError, authenticatedDb, rateLimit } from "@/src/server/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    if (!(await rateLimit(request, "pix-create", 12, 3600)))
      return Response.json({ error: "rate_limited" }, { status: 429 });
    const { id } = await params;
    const { data: quote, error } = await auth.db
      .from("quotes")
      .select("id,total_cents,status,customers(email)")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (!["contracted", "awaiting_payment"].includes(quote.status))
      return Response.json({ error: "payment_not_available" }, { status: 409 });
    const customer = Array.isArray(quote.customers)
      ? quote.customers[0]
      : quote.customers;
    if (!customer?.email)
      return Response.json(
        { error: "customer_email_required" },
        { status: 422 },
      );
    const { data: existing, error: existingError } = await auth.db
      .from("payments")
      .select("id")
      .eq("quote_id", quote.id)
      .eq("provider", "mercado_pago")
      .eq("status", "pending")
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing)
      return Response.json(
        { error: "payment_already_pending" },
        { status: 409 },
      );

    const accessToken = await sellerAccessToken(auth.user.id);
    if (!accessToken)
      return Response.json(
        { error: "mercado_pago_not_connected" },
        { status: 409 },
      );
    const order = await createPixOrder({
      accessToken,
      quoteId: quote.id,
      amountCents: quote.total_cents,
      email: customer.email,
    });
    const db = adminDb();
    const { error: paymentError } = await db.from("payments").upsert(
      {
        quote_id: quote.id,
        status: "pending",
        provider: "mercado_pago",
        provider_reference: order.orderId,
        external_reference: quote.id,
        amount_cents: quote.total_cents,
        raw_status: `${order.status}:${order.statusDetail}`,
        pix_code: order.pix?.qrCode,
        ticket_url: order.pix?.ticketUrl,
      },
      { onConflict: "provider,provider_reference" },
    );
    if (paymentError) throw paymentError;
    const { error: quoteError } = await db
      .from("quotes")
      .update({ status: "awaiting_payment" })
      .eq("id", quote.id);
    if (quoteError) throw quoteError;
    return Response.json(
      {
        paymentId: order.orderId,
        status: order.status,
        statusDetail: order.statusDetail,
        pix: order.pix,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
