import { z } from "zod";
import { apiError, authenticatedDb } from "@/src/server/http";

const schema = z.object({
  rules: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startTime: z.string().nullable(),
        endTime: z.string().nullable(),
        enabled: z.boolean(),
      }),
    )
    .max(7),
});

export async function GET(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { data, error } = await auth.db
      .from("availability_rules")
      .select("*")
      .order("weekday");
    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const body = schema.parse(await request.json());
    const { error: deleteError } = await auth.db
      .from("availability_rules")
      .delete()
      .eq("user_id", auth.user.id);
    if (deleteError) throw deleteError;
    if (body.rules.length === 0) return Response.json({ data: [] });
    const { data, error } = await auth.db
      .from("availability_rules")
      .insert(
        body.rules.map((rule) => ({
          user_id: auth.user.id,
          weekday: rule.weekday,
          start_time: rule.startTime,
          end_time: rule.endTime,
          enabled: rule.enabled,
        })),
      )
      .select()
      .order("weekday");
    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return apiError(error);
  }
}
