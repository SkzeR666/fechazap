import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const REMINDERS = [
  {
    kind: "quote_expiring",
    title: "Antes do vencimento",
    when: "1 dia antes",
    body: "O FechaZap monta o lembrete da proposta que está perto de expirar.",
  },
  {
    kind: "payment_pending",
    title: "Pagamento pendente",
    when: "Após 24 horas",
    body: "Se o cliente aceitou e ainda não pagou, o aviso fica pronto no dia seguinte.",
  },
  {
    kind: "appointment_upcoming",
    title: "Serviço",
    when: "24 horas antes",
    body: "Lembrete do atendimento marcado, para você enviar no WhatsApp.",
  },
  {
    kind: "post_service",
    title: "Pós-serviço",
    when: "2 horas depois",
    body: "Um toque depois do horário, para você marcar como concluído ou pedir o restante.",
  },
];

export default function AppNotificationsSettingsPage() {
  return (
    <div className="grid max-w-xl gap-6">
      <Button asChild variant="ghost" className="-ml-2 w-fit">
        <Link href="/app/configuracoes">← Configurações</Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold">Notificações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Não há interruptores nesta tela. O cron já gera os lembretes; nenhuma
          mensagem sai sozinha — você envia o link do WhatsApp quando quiser.
        </p>
      </div>
      {REMINDERS.map((item) => (
        <Card key={item.kind} className="p-4">
          <p className="font-medium">{item.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.when}</p>
          <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
        </Card>
      ))}
    </div>
  );
}
