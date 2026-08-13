import { processMercadoPagoWebhook } from "@/src/modules/payments/mercado-pago/webhook";
import { apiError } from "@/src/server/http";

export async function POST(request: Request) {
  try {
    return await processMercadoPagoWebhook(request);
  } catch (error) {
    return apiError(error);
  }
}
