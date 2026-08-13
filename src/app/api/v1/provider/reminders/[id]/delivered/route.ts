import { apiError, authenticatedDb } from "@/src/server/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const { data, error } = await auth.db
      .from("reminders")
      .update({ delivered_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return Response.json(data);
  } catch (e) {
    return apiError(e);
  }
}
