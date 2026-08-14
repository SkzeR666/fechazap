import { z } from "zod";
import { quoteStatuses } from "@/src/domain/quote-state";
import { apiError, authenticatedDb } from "@/src/server/http";

export async function GET(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const status = z
      .enum(quoteStatuses)
      .optional()
      .parse(new URL(request.url).searchParams.get("status") ?? undefined);
    let query = auth.db
      .from("quotes")
      .select("*, customers(*), quote_items(*), appointments(*), quote_events(*)")
      .order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

const createSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(8).max(30),
    email: z.string().email().optional(),
  }),
  title: z.string().min(1).max(200).optional(),
  message: z.string().max(2000).optional(),
});
export async function POST(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const body = createSchema.parse(await request.json());
    const { data: customer, error: customerError } = await auth.db
      .from("customers")
      .upsert(
        { user_id: auth.user.id, ...body.customer },
        { onConflict: "user_id,phone" },
      )
      .select()
      .single();
    if (customerError) throw customerError;
    const { data, error } = await auth.db
      .from("quotes")
      .insert({
        user_id: auth.user.id,
        customer_id: customer.id,
        title: body.title,
        message: body.message,
        status: "draft",
      })
      .select()
      .single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
