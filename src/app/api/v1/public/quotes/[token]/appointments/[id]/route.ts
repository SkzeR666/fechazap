import { adminDb } from "@/src/modules/auth/supabase";
import { apiError } from "@/src/server/http";
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string; id: string }> },
) {
  try {
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
