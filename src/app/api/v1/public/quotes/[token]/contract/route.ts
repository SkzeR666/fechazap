import { adminDb } from "@/src/modules/auth/supabase";
import { createDownloadUrl } from "@/src/modules/files/service";
import { apiError, rateLimit } from "@/src/server/http";
import { parseClosingMeta } from "@/lib/closing-meta";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const db = adminDb();
    const { data: quote, error: quoteError } = await db
      .from("quotes")
      .select("id, status")
      .eq("public_token", token)
      .maybeSingle();
    if (quoteError) throw quoteError;
    if (!quote) return Response.json({ error: "not_found" }, { status: 404 });
    if (
      ![
        "contracted",
        "awaiting_payment",
        "scheduling_pending",
        "paid",
        "scheduled",
        "completed",
      ].includes(quote.status)
    )
      return Response.json({ error: "contract_unavailable" }, { status: 409 });
    const { data: document, error } = await db
      .from("documents")
      .select("object_key")
      .eq("quote_id", quote.id)
      .eq("kind", "contract")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!document)
      return Response.json({ error: "contract_unavailable" }, { status: 404 });
    return Response.json({
      downloadUrl: createDownloadUrl(document.object_key),
      expiresIn: 300,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    if (!(await rateLimit(request, "quote-contract", 10, 300)))
      return Response.json({ error: "rate_limited" }, { status: 429 });
    const { token } = await params;
    const db = adminDb();
    const { data, error } = await db.rpc("accept_public_contract", {
      p_public_token: token,
    });
    if (error)
      return Response.json(
        { error: "contract_not_acceptable", detail: error.message },
        { status: 409 },
      );
    const { data: quote } = await db
      .from("quotes")
      .select("id, message, status")
      .eq("public_token", token)
      .maybeSingle();
    if (quote) {
      const meta = parseClosingMeta(quote.message);
      if (meta.payment === "none") {
        const nextStatus =
          meta.schedule === "now" ? "scheduled" : "scheduling_pending";
        await db.from("quotes").update({ status: nextStatus }).eq("id", quote.id);
        if (meta.schedule === "now") {
          await db
            .from("appointments")
            .update({ status: "selected", selected_at: new Date().toISOString() })
            .eq("quote_id", quote.id)
            .eq("status", "offered");
        }
        return Response.json({ id: quote.id, status: nextStatus });
      }
    }
    return Response.json(data);
  } catch (error) {
    return apiError(error);
  }
}
