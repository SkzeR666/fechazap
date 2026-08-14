import { z } from "zod";
import { apiError, authenticatedDb } from "@/src/server/http";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  email: z.string().email().optional(),
});

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

export async function POST(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const body = createSchema.parse(await request.json());
    const { data, error } = await auth.db
      .from("customers")
      .insert({
        user_id: auth.user.id,
        name: body.name,
        phone: body.phone,
        email: body.email,
      })
      .select()
      .single();
    if (error?.code === "23505")
      return Response.json({ error: "phone_taken" }, { status: 409 });
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
