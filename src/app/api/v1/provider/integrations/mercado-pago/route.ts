import { adminDb } from "@/src/modules/auth/supabase";
import { createAuthorization } from "@/src/modules/payments/mercado-pago/connect";
import { apiError, authenticatedDb } from "@/src/server/http";

export async function GET(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { data, error } = await adminDb()
      .from("mercado_pago_connections")
      .select("mercado_pago_user_id,connected_at,updated_at")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    return Response.json({
      connected: Boolean(data),
      accountId: data?.mercado_pago_user_id ?? null,
      connectedAt: data?.connected_at ?? null,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    return Response.json({ authorizationUrl: await createAuthorization(auth.user.id) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { error } = await adminDb()
      .from("mercado_pago_connections")
      .delete()
      .eq("user_id", auth.user.id);
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
