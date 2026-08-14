import { z } from "zod";
import {
  apiError,
  authenticatedDb,
  rateLimit,
  validatedJson,
} from "@/src/server/http";
import { fileExists } from "@/src/modules/files/service";

const schema = z.object({
  objectKey: z.string().min(1).max(800),
  kind: z.enum(["logo", "image", "attachment", "quote_pdf"]),
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]),
  quoteId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    if (!(await rateLimit(request, "file-confirm", 30, 3600)))
      return Response.json({ error: "rate_limited" }, { status: 429 });
    const body = await validatedJson(request, schema, 4_096);
    if (!body.objectKey.startsWith(`users/${auth.user.id}/`))
      return Response.json({ error: "invalid_object_key" }, { status: 403 });
    if (body.kind !== "logo" && !body.quoteId)
      return Response.json({ error: "quote_id_required" }, { status: 422 });
    if (!(await fileExists(body.objectKey)))
      return Response.json({ error: "upload_not_found" }, { status: 409 });

    if (body.quoteId) {
      const { error } = await auth.db
        .from("quotes")
        .select("id")
        .eq("id", body.quoteId)
        .single();
      if (error) throw error;
    }

    const { data, error } = await auth.db
      .from("documents")
      .insert({
        user_id: auth.user.id,
        quote_id: body.quoteId,
        kind: body.kind,
        object_key: body.objectKey,
        content_type: body.contentType,
      })
      .select()
      .single();
    if (error) throw error;
    return Response.json({ document: data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
