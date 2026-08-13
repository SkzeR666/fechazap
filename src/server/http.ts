import { z } from 'zod';
import { userDb } from '../lib/supabase';

export function apiError(error: unknown) {
  console.error(error);
  if (error instanceof z.ZodError) return Response.json({ error: 'invalid_request', issues: error.issues }, { status: 400 });
  return Response.json({ error: 'internal_error' }, { status: 500 });
}

export async function authenticatedDb(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const db = userDb(token);
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return null;
  return { db, user };
}
