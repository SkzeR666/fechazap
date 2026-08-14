import { adminDb } from "@/src/modules/auth/supabase";
import { apiError, rateLimit } from "@/src/server/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string; id: string }> },
) {
  try {
    if (!(await rateLimit(request, "appointment-select", 12, 300)))
      return Response.json({ error: "rate_limited" }, { status: 429 });
    const { token, id } = await params;
    const { data, error } = await adminDb().rpc("select_appointment", {
      p_public_token: token,
      p_appointment_id: id,
    });
    if (error)
      return Response.json({ error: "slot_unavailable" }, { status: 409 });
    return Response.json(data);
  } catch (e) {
    return apiError(e);
  }
}
