import { z } from 'zod';
import { apiError, authenticatedDb } from '@/src/server/http';

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{2,47}$/), businessName: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(500).optional(), logoUrl: z.string().url().optional(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(), whatsapp: z.string().trim().max(30).optional(),
  pixKey: z.string().trim().max(180).optional(),
});

export async function PUT(request: Request) {
  try {
    const auth = await authenticatedDb(request);
    if (!auth) return Response.json({ error: 'unauthorized' }, { status: 401 });
    const body = schema.parse(await request.json());
    const { data, error } = await auth.db.from('profiles').upsert({ user_id: auth.user.id, slug: body.slug, business_name: body.businessName, bio: body.bio, logo_url: body.logoUrl, brand_color: body.brandColor, whatsapp: body.whatsapp, pix_key: body.pixKey }).select().single();
    if (error) throw error;
    return Response.json(data);
  } catch (error) { return apiError(error); }
}
