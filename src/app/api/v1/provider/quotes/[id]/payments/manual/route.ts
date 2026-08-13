import { apiError, authenticatedDb } from "@/src/server/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const { data, error } = await auth.db.rpc("confirm_manual_payment", {
      p_quote_id: id,
    });
    if (error)
      return Response.json(
        { error: "payment_not_confirmable" },
        { status: 409 },
      );
    return Response.json(data, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
