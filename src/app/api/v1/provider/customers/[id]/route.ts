import { apiError, authenticatedDb } from "@/src/server/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const { data, error } = await auth.db
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const { error } = await auth.db.from("customers").delete().eq("id", id);
    if (error?.code === "23503")
      return Response.json({ error: "customer_in_use" }, { status: 409 });
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
