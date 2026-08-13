import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_JWKS_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SECRET_KEY: z.string().startsWith('sb_secret_').optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  ACCEPTANCE_ENCRYPTION_KEY: z.string().regex(/^[a-fA-F0-9]{64}$/),
  CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY: z.string().min(1).optional(),
  MERCADO_PAGO_USER_ID: z.string().min(1).optional(),
  MERCADO_PAGO_APP_ID: z.string().min(1).optional(),
  MERCADO_PAGO_CLIENT_ID: z.string().min(1).optional(),
  MERCADO_PAGO_CLIENT_SECRET: z.string().min(1).optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().min(1).optional(),
}).refine((value) => value.SUPABASE_SECRET_KEY || value.SUPABASE_SERVICE_ROLE_KEY, {
  message: 'SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required',
});

export type Env = z.infer<typeof schema>;
let cached: Env | undefined;

export function env(): Env {
  cached ??= schema.parse(process.env);
  return cached;
}
