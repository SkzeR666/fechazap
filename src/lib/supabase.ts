import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from '../config';

const serverTransport = WebSocket as never;

export function adminDb() {
  const config = env();
  const secretKey = config.SUPABASE_SECRET_KEY ?? config.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(config.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: serverTransport },
  });
}

export function userDb(accessToken: string) {
  const config = env();
  return createClient(config.NEXT_PUBLIC_SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: serverTransport },
  });
}
