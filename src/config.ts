import { z } from 'zod';

const optionalString = z.preprocess((v) => v === '' ? undefined : v, z.string().min(1).optional());
const optionalUrl = z.preprocess((v) => v === '' ? undefined : v, z.string().url().optional());

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_JWKS_URL: optionalUrl,
  SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SECRET_KEY: z.preprocess((v) => v === '' ? undefined : v, z.string().startsWith('sb_secret_').optional()),
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  ACCEPTANCE_ENCRYPTION_KEY: z.string().regex(/^[a-fA-F0-9]{64}$/),
  CLOUDFLARE_ACCOUNT_ID: optionalString,
  CLOUDFLARE_R2_BUCKET: optionalString,
  CLOUDFLARE_R2_ENDPOINT: optionalUrl,
  CLOUDFLARE_R2_PUBLIC_URL: optionalUrl,
  CLOUDFLARE_R2_ACCESS_KEY_ID: optionalString,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: optionalString,
  CLOUDFLARE_FILES_WORKER_URL: optionalUrl,
  CLOUDFLARE_FILES_WORKER_SECRET: optionalString,
  CLOUDFLARE_TURNSTILE_SECRET_KEY: optionalString,
  CRON_SECRET: z.preprocess((v) => v === '' ? undefined : v, z.string().min(24).optional()),
  APP_URL: optionalUrl,
  MERCADO_PAGO_ACCESS_TOKEN: optionalString,
  NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY: optionalString,
  MERCADO_PAGO_USER_ID: optionalString,
  MERCADO_PAGO_APP_ID: optionalString,
  MERCADO_PAGO_CLIENT_ID: optionalString,
  MERCADO_PAGO_CLIENT_SECRET: optionalString,
  MERCADO_PAGO_WEBHOOK_SECRET: optionalString,
}).refine((value) => value.SUPABASE_SECRET_KEY || value.SUPABASE_SERVICE_ROLE_KEY, {
  message: 'SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required',
});

export type Env = z.infer<typeof schema>;
let cached: Env | undefined;

export function env(): Env {
  cached ??= schema.parse(process.env);
  return cached;
}
