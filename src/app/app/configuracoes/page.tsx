import Link from "next/link";
import { Card } from "@/components/ui/card";

const ITEMS = [
  {
    href: "/app/configuracoes/negocio",
    title: "Negócio",
    body: "Nome, link e como seus clientes te encontram.",
  },
  {
    href: "/app/configuracoes/perfil",
    title: "Perfil",
    body: "Senha da sua conta FechaZap.",
  },
  {
    href: "/app/configuracoes/pagamentos",
    title: "Pagamentos",
    body: "Chave PIX e Mercado Pago.",
  },
  {
    href: "/app/configuracoes/agenda",
    title: "Agenda",
    body: "Dias e horários em que você atende.",
  },
  {
    href: "/app/configuracoes/notificacoes",
    title: "Notificações",
    body: "Lembretes que o FechaZap já prepara.",
  },
  {
    href: "/app/configuracoes/personalizacao",
    title: "Personalização",
    body: "Logo e cor da sua página.",
  },
  {
    href: "/app/configuracoes/plano",
    title: "Plano",
    body: "Grátis, Solo ou Pro.",
  },
  {
    href: "/app/links",
    title: "Links",
    body: "Sua página pública e o link permanente.",
  },
  {
    href: "/app/relatorios",
    title: "Relatórios",
    body: "Taxa de fechamento, funil e desempenho.",
  },
  {
    href: "/app/integracoes",
    title: "Integrações",
    body: "Mercado Pago e o que conecta o recebimento.",
  },
];

export default function AppSettingsHubPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tudo do negócio, da conta e da agenda num só lugar.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full p-4 hover:bg-muted/40">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
