import { createPixOrder } from "@/src/modules/payments/mercado-pago/orders";
import { apiError, authenticatedDb } from "@/src/server/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
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

    const order = await createPixOrder({
      quoteId: quote.id,
      amountCents: quote.total_cents,
      email: customer.email,
    });
    const { error: paymentError } = await auth.db.from("payments").upsert(
      {
        quote_id: quote.id,
        status: "pending",
        provider: "mercado_pago",
        provider_reference: order.orderId,
        external_reference: quote.id,
        amount_cents: quote.total_cents,
        raw_status: `${order.status}:${order.statusDetail}`,
      },
      { onConflict: "provider,provider_reference" },
    );
    if (paymentError) throw paymentError;
    const { error: quoteError } = await auth.db
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
