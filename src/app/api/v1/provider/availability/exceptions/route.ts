import { z } from "zod";
import { apiError, authenticatedDb, validatedJson } from "@/src/server/http";

const schema = z.object({
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  reason: z.string().trim().max(200).optional(),
});

export async function GET(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { data, error } = await auth.db
      .from("availability_exceptions")
      .select("*")
      .order("starts_at");
    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const body = await validatedJson(request, schema, 4_096);
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      return Response.json({ error: "invalid_range" }, { status: 400 });
    }
    const { data, error } = await auth.db
      .from("availability_exceptions")
      .insert({
        user_id: auth.user.id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        reason: body.reason,
      })
      .select()
      .single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
