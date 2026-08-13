import { createDownloadUrl, deleteFile } from "@/src/modules/files/service";
import { apiError, authenticatedDb } from "@/src/server/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const { data, error } = await auth.db
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return Response.json({
      document: data,
      downloadUrl: createDownloadUrl(data.object_key),
      expiresIn: 300,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const { data, error } = await auth.db
      .from("documents")
      .select("object_key")
      .eq("id", id)
      .single();
    if (error) throw error;
    await deleteFile(data.object_key);
    const { error: databaseError } = await auth.db
      .from("documents")
      .delete()
      .eq("id", id);
    if (databaseError) throw databaseError;
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
