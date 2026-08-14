import { adminDb } from "@/src/modules/auth/supabase";
import { createDownloadUrl } from "@/src/modules/files/service";
import { apiError } from "@/src/server/http";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const db = adminDb();
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("user_id")
      .eq("slug", slug.toLowerCase())
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return new Response(null, { status: 404 });
    const { data: document, error } = await db
      .from("documents")
      .select("object_key")
      .eq("user_id", profile.user_id)
      .eq("kind", "logo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!document) return new Response(null, { status: 404 });
    return Response.redirect(createDownloadUrl(document.object_key), 302);
  } catch (error) {
    return apiError(error);
  }
}
