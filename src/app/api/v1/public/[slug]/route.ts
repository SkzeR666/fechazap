import { adminDb } from '@/src/lib/supabase';
import { apiError } from '@/src/server/http';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { data, error } = await adminDb().rpc('get_public_profile', { requested_slug: slug });
    if (error) throw error;
    if (!data) return Response.json({ error: 'not_found' }, { status: 404 });
    return Response.json(data);
  } catch (error) {
    return apiError(error);
  }
}
