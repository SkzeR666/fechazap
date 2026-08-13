import { randomUUID } from "node:crypto";
import { mpPost } from "./client";

type PixOrder = {
  id: string;
  status: string;
  status_detail: string;
  transactions?: {
    payments?: Array<{
      payment_method?: {
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
      };
    }>;
  };
};

export async function createPixOrder(input: {
  quoteId: string;
  amountCents: number;
  email: string;
}) {
  const amount = (input.amountCents / 100).toFixed(2);
  const order = (await mpPost(
    "/v1/orders",
    {
      type: "online",
      total_amount: amount,
      external_reference: input.quoteId,
      processing_mode: "automatic",
      transactions: {
        payments: [
          {
            amount,
            payment_method: { id: "pix", type: "bank_transfer" },
            expiration_time: "P1D",
          },
        ],
      },
      payer: { email: input.email },
    },
    randomUUID(),
  )) as PixOrder;
  const paymentMethod = order.transactions?.payments?.[0]?.payment_method;
  return {
    orderId: order.id,
    status: order.status,
    statusDetail: order.status_detail,
    pix: paymentMethod && {
      qrCode: paymentMethod.qr_code,
      qrCodeBase64: paymentMethod.qr_code_base64,
      ticketUrl: paymentMethod.ticket_url,
    },
  };
}
