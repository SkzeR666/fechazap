import { z } from "zod";

const platformSchema = z.object({
  APP_URL: z.string().url(),
  CRON_SECRET: z.string().min(24),
  ACCEPTANCE_ENCRYPTION_KEY: z.string().regex(/^[a-fA-F0-9]{64}$/),
});

const supabaseSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().startsWith("sb_secret_"),
});

const filesSchema = z.object({
  CLOUDFLARE_FILES_WORKER_URL: z.string().url(),
  CLOUDFLARE_FILES_WORKER_SECRET: z.string().min(32),
});

const mercadoPagoSchema = z.object({
  MERCADO_PAGO_ACCESS_TOKEN: z.string().startsWith("APP_USR-"),
  MERCADO_PAGO_APP_ID: z.string().regex(/^\d+$/),
});

const mercadoPagoWebhookSchema = mercadoPagoSchema.extend({
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().min(16),
});

export const platformEnv = () => platformSchema.parse(process.env);
export const supabaseEnv = () => supabaseSchema.parse(process.env);
export const filesEnv = () => filesSchema.parse(process.env);
export const mercadoPagoEnv = () => mercadoPagoSchema.parse(process.env);
export const mercadoPagoWebhookEnv = () =>
  mercadoPagoWebhookSchema.parse(process.env);
