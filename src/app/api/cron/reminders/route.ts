import { adminDb } from "@/src/modules/auth/supabase";
import { platformEnv } from "@/src/modules/platform/env";
import { whatsappUrl } from "@/src/lib/whatsapp";

export async function GET(request: Request) {
  if (
    request.headers.get("authorization") !==
    `Bearer ${platformEnv().CRON_SECRET}`
  )
    return new Response("Unauthorized", { status: 401 });
  const db = adminDb();
  const { data, error } = await db
    .from("reminders")
    .select("*,quotes(public_token,customers(phone,name))")
    .is("delivered_at", null)
    .lte("due_at", new Date().toISOString())
    .limit(100);
  if (error) throw error;
  const reminders = (data ?? []).map((reminder) => ({
    id: reminder.id,
    kind: reminder.kind,
    whatsappUrl: whatsappUrl(
      reminder.quotes.customers.phone,
      `Olá ${reminder.quotes.customers.name}, lembrete do seu atendimento FechaZap: ${reminder.kind}.`,
    ),
  }));
  return Response.json({
    count: reminders.length,
    reminders,
    note: "URLs prontas para envio humano; nenhuma mensagem é enviada automaticamente.",
  });
}
