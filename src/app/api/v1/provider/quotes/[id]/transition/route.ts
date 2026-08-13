import { z } from "zod";
import { quoteStatuses } from "@/src/domain/quote-state";
import { apiError, authenticatedDb } from "@/src/server/http";

const schema = z.object({
  to: z.enum(quoteStatuses),
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const [{ id }, body] = await Promise.all([
      params,
      request.json().then((value) => schema.parse(value)),
    ]);
    const { data, error } = await auth.db.rpc("transition_quote", {
      quote_id: id,
      next_status: body.to,
      transition_reason: body.reason ?? null,
    });
    if (error)
      return Response.json(
        { error: "invalid_transition", detail: error.message },
        { status: 409 },
      );
    return Response.json(data);
  } catch (error) {
    return apiError(error);
  }
}
