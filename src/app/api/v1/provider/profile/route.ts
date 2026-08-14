import { z } from "zod";
import { apiError, authenticatedDb, validatedJson } from "@/src/server/http";
import { RESERVED_SLUGS } from "@/lib/slugs";

const schema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{2,47}$/)
    .refine((value) => !RESERVED_SLUGS.has(value), "slug_reserved"),
  businessName: z.string().trim().min(2).max(120),
  displayName: z.string().trim().max(120).optional(),
  instagram: z.string().trim().max(80).optional(),
  document: z.string().trim().max(20).optional(),
  address: z.string().trim().max(240).optional(),
  serviceModes: z.array(z.enum(["presencial", "cliente", "online"])).optional(),
  cancellationPolicy: z.string().trim().max(500).optional(),
  bio: z.string().trim().max(500).optional(),
  logoUrl: z.string().url().optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  whatsapp: z.string().trim().max(30).optional(),
  pixKey: z.string().trim().max(180).optional(),
});

export async function GET(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { data, error } = await auth.db
      .from("profiles")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();
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
    const body = await validatedJson(request, schema, 8_192);
    const row: Record<string, unknown> = {
      user_id: auth.user.id,
      slug: body.slug,
      business_name: body.businessName,
      bio: body.bio,
      logo_url: body.logoUrl,
      brand_color: body.brandColor,
      whatsapp: body.whatsapp,
      pix_key: body.pixKey,
    };
    if (body.displayName !== undefined) row.display_name = body.displayName;
    if (body.instagram !== undefined) row.instagram = body.instagram;
    if (body.document !== undefined) row.document = body.document;
    if (body.address !== undefined) row.address = body.address;
    if (body.serviceModes !== undefined) row.service_modes = body.serviceModes;
    if (body.cancellationPolicy !== undefined) {
      row.cancellation_policy = body.cancellationPolicy;
    }
    const { data, error } = await auth.db
      .from("profiles")
      .upsert(row)
      .select()
      .single();
    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    return apiError(error);
  }
}
