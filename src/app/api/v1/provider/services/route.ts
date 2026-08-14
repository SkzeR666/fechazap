import { z } from "zod";
import { apiError, authenticatedDb } from "@/src/server/http";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  priceCents: z.number().int().nonnegative().nullable().optional(),
  durationMinutes: z.number().int().positive().max(24 * 60).nullable().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { data, error } = await auth.db
      .from("services")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return Response.json({ data });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const body = schema.parse(await request.json());
    const { data, error } = await auth.db
      .from("services")
      .insert({
        user_id: auth.user.id,
        name: body.name,
        description: body.description,
        price_cents: body.priceCents,
        duration_minutes: body.durationMinutes,
        active: body.active,
        sort_order: body.sortOrder,
      })
      .select()
      .single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
