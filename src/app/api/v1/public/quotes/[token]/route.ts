import { adminDb } from "@/src/modules/auth/supabase";
import { apiError } from "@/src/server/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const { data, error } = await adminDb().rpc("get_public_quote", {
      p_public_token: token,
    });
    if (error) {
      if (error.message?.includes("quote_not_found"))
        return Response.json({ error: "not_found" }, { status: 404 });
      throw error;
    }
    if (!data) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json(data);
  } catch (error) {
    return apiError(error);
  }
}
