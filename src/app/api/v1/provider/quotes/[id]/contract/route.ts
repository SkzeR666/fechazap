import { contractPdf } from "@/src/lib/pdf";
import { fileKey } from "@/src/modules/files/keys";
import { createDownloadUrl, uploadFile } from "@/src/modules/files/service";
import { apiError, authenticatedDb } from "@/src/server/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const { data: quote, error } = await auth.db
      .from("quotes")
      .select(
        "*,profiles!quotes_user_id_fkey(business_name),customers(id,name),acceptances(accepted_at)",
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    const customer = Array.isArray(quote.customers)
      ? quote.customers[0]
      : quote.customers;
    const profile = Array.isArray(quote.profiles)
      ? quote.profiles[0]
      : quote.profiles;
    const terms =
      quote.contract_terms ??
      "O prestador executará os serviços descritos no orçamento aceito, conforme valores, prazos e condições acordados.";
    const bytes = await contractPdf({
      business: profile.business_name,
      customer: customer.name,
      title: quote.title ?? "Serviços contratados",
      totalCents: quote.total_cents,
      terms,
      acceptedAt: quote.acceptances?.[0]?.accepted_at,
    });
    const key = fileKey({
      userId: auth.user.id,
      customerId: customer.id,
      quoteId: id,
      category: "contract",
      extension: "pdf",
    });
    await uploadFile(key, bytes, "application/pdf");
    const { error: documentError } = await auth.db.from("documents").upsert(
      {
        user_id: auth.user.id,
        quote_id: id,
        kind: "contract",
        object_key: key,
        content_type: "application/pdf",
        size_bytes: bytes.length,
      },
      { onConflict: "object_key" },
    );
    if (documentError) throw documentError;
    const { error: quoteError } = await auth.db
      .from("quotes")
      .update({
        contract_terms: terms,
        contract_generated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (quoteError) throw quoteError;
    return Response.json(
      { downloadUrl: createDownloadUrl(key), expiresIn: 300 },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
