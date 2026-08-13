import { z } from "zod";
import { fileKey, type FileCategory } from "@/src/modules/files/keys";
import { createUploadUrl } from "@/src/modules/files/service";
import { apiError, authenticatedDb } from "@/src/server/http";

const schema = z.object({
  kind: z.enum(["brand", "image", "attachment", "quote_pdf"]),
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]),
  quoteId: z.string().uuid().optional(),
  fileName: z.string().trim().min(1).max(180),
});

const databaseKind = {
  brand: "logo",
  image: "image",
  attachment: "attachment",
  quote_pdf: "quote_pdf",
} as const;

export async function POST(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const body = schema.parse(await request.json());
    if (body.kind !== "brand" && !body.quoteId)
      return Response.json({ error: "quote_id_required" }, { status: 422 });
    if (body.kind === "quote_pdf" && body.contentType !== "application/pdf")
      return Response.json({ error: "pdf_required" }, { status: 422 });

    let customerId: string | undefined;
    if (body.quoteId) {
      const { data: quote, error } = await auth.db
        .from("quotes")
        .select("customer_id")
        .eq("id", body.quoteId)
        .single();
      if (error) throw error;
      customerId = quote.customer_id;
    }
    const extension = body.fileName.split(".").pop() ?? "bin";
    const key = fileKey({
      userId: auth.user.id,
      customerId,
      quoteId: body.quoteId,
      category: body.kind as FileCategory,
      extension,
    });
    const { data, error } = await auth.db
      .from("documents")
      .insert({
        user_id: auth.user.id,
        quote_id: body.quoteId,
        kind: databaseKind[body.kind],
        object_key: key,
        content_type: body.contentType,
      })
      .select()
      .single();
    if (error) throw error;
    return Response.json(
      {
        document: data,
        uploadUrl: createUploadUrl(key, body.contentType),
        expiresIn: 600,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
