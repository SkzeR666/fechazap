import { z } from "zod";
import { apiError, authenticatedDb } from "@/src/server/http";

const item = z.object({
  serviceId: z.string().uuid().nullable().optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  sortOrder: z.number().int().default(0),
});
const update = z.object({
  title: z.string().min(1).max(200),
  discountCents: z.number().int().nonnegative().default(0),
  expiresAt: z.string().datetime().nullable().optional(),
  items: z.array(item).min(1).max(50),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const { data, error } = await auth.db
      .from("quotes")
      .select(
        "*,customers(*),quote_items(*),acceptances(*),payments(*),appointments(*),quote_events(*)",
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    return Response.json(data);
  } catch (e) {
    return apiError(e);
  }
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const [{ id }, body] = await Promise.all([
      params,
      request.json().then((v) => update.parse(v)),
    ]);
    const { data, error } = await auth.db.rpc("replace_quote_items", {
      p_quote_id: id,
      p_title: body.title,
      p_discount_cents: body.discountCents,
      p_expires_at: body.expiresAt ?? null,
      p_items: body.items,
    });
    if (error) throw error;
    return Response.json(data);
  } catch (e) {
    return apiError(e);
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
    const { error } = await auth.db
      .from("quotes")
      .delete()
      .eq("id", id)
      .in("status", ["requested", "draft", "cancelled"]);
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (e) {
    return apiError(e);
  }
}
