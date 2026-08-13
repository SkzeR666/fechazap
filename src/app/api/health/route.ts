export const runtime = "nodejs";

export function GET() {
  return Response.json({
    ok: true,
    service: "fechazap-api",
    configuration: {
      supabase: Boolean(
        process.env.SUPABASE_URL &&
        process.env.SUPABASE_PUBLISHABLE_KEY &&
        process.env.SUPABASE_SECRET_KEY,
      ),
      filesWorker: Boolean(
        process.env.CLOUDFLARE_FILES_WORKER_URL &&
        process.env.CLOUDFLARE_FILES_WORKER_SECRET,
      ),
      mercadoPago: Boolean(
        process.env.MERCADO_PAGO_ACCESS_TOKEN &&
        process.env.MERCADO_PAGO_APP_ID,
      ),
      mercadoPagoWebhook: Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET),
    },
  });
}
