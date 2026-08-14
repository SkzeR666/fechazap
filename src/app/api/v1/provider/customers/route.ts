import { apiError, authenticatedDb } from "@/src/server/http";

export async function GET(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { data, error } = await auth.db
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return apiError(error);
  }
}
