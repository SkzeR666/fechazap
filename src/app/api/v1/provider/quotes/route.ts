import { z } from 'zod';
import { quoteStatuses } from '@/src/domain/quote-state';
import { apiError, authenticatedDb } from '@/src/server/http';

export async function GET(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const status = z.enum(quoteStatuses).optional().parse(new URL(request.url).searchParams.get('status') ?? undefined);
    let query = auth.db.from('quotes').select('*, customers(*), quote_items(*)').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return Response.json({ data });
  } catch (error) { return apiError(error); }
}
