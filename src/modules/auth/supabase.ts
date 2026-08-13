import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { supabaseEnv } from "../platform/env";

const serverTransport = WebSocket as never;

function options() {
  return {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: serverTransport },
  };
}

export function adminDb() {
  const config = supabaseEnv();
  return createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SECRET_KEY,
    options(),
  );
}

export function userDb(accessToken: string) {
  const config = supabaseEnv();
  return createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
    ...options(),
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
