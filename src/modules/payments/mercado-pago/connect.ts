import { createHash, randomBytes } from "node:crypto";
import { adminDb } from "../../auth/supabase";
import { platformEnv, mercadoPagoOAuthEnv } from "../../platform/env";
import { protectSecret, unprotectSecret } from "../../../lib/crypto";
import { MercadoPagoError } from "./client";

const apiBase = "https://api.mercadopago.com";
const redirectUri = () =>
  `${platformEnv().APP_URL}/api/v1/provider/integrations/mercado-pago/callback`;
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

type OAuthToken = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
  scope?: string;
};

async function tokenRequest(body: Record<string, string>) {
  const response = await fetch(`${apiBase}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok)
    throw new MercadoPagoError(response.status, await response.text());
  return (await response.json()) as OAuthToken;
}

export async function createAuthorization(userId: string) {
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(64).toString("base64url");
  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");
  const db = adminDb();
  await db.from("mercado_pago_oauth_states").delete().eq("user_id", userId);
  const { error } = await db.from("mercado_pago_oauth_states").insert({
    state_hash: hash(state),
    user_id: userId,
    code_verifier_ciphertext: protectSecret(verifier),
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  });
  if (error) throw error;
  const config = mercadoPagoOAuthEnv();
  const url = new URL("https://auth.mercadopago.com/authorization");
  url.searchParams.set("client_id", config.MERCADO_PAGO_APP_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function finishAuthorization(code: string, state: string) {
  const db = adminDb();
  const { data, error } = await db
    .from("mercado_pago_oauth_states")
    .delete()
    .eq("state_hash", hash(state))
    .gt("expires_at", new Date().toISOString())
    .select()
    .single();
  if (error || !data) throw new Error("invalid_oauth_state");
  const config = mercadoPagoOAuthEnv();
  const token = await tokenRequest({
    client_id: config.MERCADO_PAGO_APP_ID,
    client_secret: config.MERCADO_PAGO_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    code_verifier: unprotectSecret(data.code_verifier_ciphertext),
  });
  const { error: saveError } = await db
    .from("mercado_pago_connections")
    .upsert({
      user_id: data.user_id,
      mercado_pago_user_id: String(token.user_id),
      access_token_ciphertext: protectSecret(token.access_token),
      refresh_token_ciphertext: protectSecret(token.refresh_token),
      expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      scope: token.scope,
      updated_at: new Date().toISOString(),
    });
  if (saveError) throw saveError;
}

export async function sellerAccessToken(userId: string) {
  const db = adminDb();
  const { data, error } = await db
    .from("mercado_pago_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (new Date(data.expires_at).getTime() > Date.now() + 5 * 60_000)
    return unprotectSecret(data.access_token_ciphertext);

  const config = mercadoPagoOAuthEnv();
  const token = await tokenRequest({
    client_id: config.MERCADO_PAGO_APP_ID,
    client_secret: config.MERCADO_PAGO_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: unprotectSecret(data.refresh_token_ciphertext),
  });
  const { error: updateError } = await db
    .from("mercado_pago_connections")
    .update({
      mercado_pago_user_id: String(token.user_id),
      access_token_ciphertext: protectSecret(token.access_token),
      refresh_token_ciphertext: protectSecret(token.refresh_token),
      expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      scope: token.scope,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (updateError) throw updateError;
  return token.access_token;
}
