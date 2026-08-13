import { z } from 'zod';
import { adminDb } from '@/src/lib/supabase';
import { apiError,rateLimit } from '@/src/server/http';
import { verifyTurnstile } from '@/src/lib/turnstile';

const schema = z.object({
  customer: z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().min(8).max(30), email: z.string().email().optional() }),
  serviceId: z.string().uuid().optional(),
  message: z.string().trim().max(2000).optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const [{ slug }, body] = await Promise.all([params, request.json().then((value) => schema.parse(value))]);
    if(!await rateLimit(request,'quote-request',5,300))return Response.json({error:'rate_limited'},{status:429});
    const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if(!await verifyTurnstile(body.turnstileToken,ip)) return Response.json({error:'challenge_failed'},{status:403});
    const { data, error } = await adminDb().rpc('create_quote_request', { requested_slug: slug, payload: body });
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
